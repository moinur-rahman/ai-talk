import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Content, Part } from '@google/genai';
import config from '../../../common/config/config.js';
import { LLMMessage, LLMRequest, TokenCallback } from '../types/llm.types.js';
import {
  LATEX_SYSTEM_INSTRUCTION,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';
import { fetchBase64FromPresignedUrl } from '../llm.utils.js';

const REASONING_MODEL_PATTERNS = [/thinking/i, /flash-thinking/i];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const contents = await this.prepareContents(request.messages);

      const stream = await this.client.models.generateContentStream({
        model: request.model,
        contents,
        config: {
          systemInstruction: LATEX_SYSTEM_INSTRUCTION,
          abortSignal: abortController.signal,
        },
      });

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.thought) {
            await onToken(part.text ?? '', 'reasoningContent', false);
          } else if (part.text) {
            await onToken(part.text, 'mainContent', false);
          }
        }
      }

      await onToken('', 'mainContent', true);
    } catch (error) {
      if (abortController.signal.aborted) {
        await onToken('', 'mainContent', true);
      } else {
        throw error;
      }
    } finally {
      this.activeStreams.delete(request.conversationId);
    }
  }

  async listModels(): Promise<
    { name: string; description: string; hasReasoning: boolean }[]
  > {
    try {
      const models: {
        name: string;
        description: string;
        hasReasoning: boolean;
      }[] = [];
      for await (const model of await this.client.models.list()) {
        const id = (model.name ?? '').replace(/^models\//, '');
        models.push({
          name: id,
          description: model.displayName ?? '',
          hasReasoning: REASONING_MODEL_PATTERNS.some((p) => p.test(id)),
        });
      }
      return models;
    } catch (error) {
      this.logger.warn('Failed to list Gemini models', error);
      return [];
    }
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: buildTitleUserPrompt(text) }],
        },
      ],
      config: {
        systemInstruction: TITLE_SYSTEM_PROMPT,
      },
    });

    return response.text?.trim() ?? '';
  }

  stopStream(conversationId: string): void {
    const abortController = this.activeStreams.get(conversationId);
    if (abortController) {
      abortController.abort();
      this.activeStreams.delete(conversationId);
    } else {
      this.logger.log(
        `No active Gemini stream found for conversation ${conversationId}`,
      );
    }
  }

  private async prepareContents(messages: LLMMessage[]): Promise<Content[]> {
    return Promise.all(
      messages.map(async (message) => {
        const role = message.senderType === 'assistant' ? 'model' : 'user';
        if (message.attachments.length > 0) {
          const parts = await this.processMessageWithFiles(message);
          return { role, parts };
        }
        return { role, parts: [{ text: message.content }] };
      }),
    );
  }

  private async processMessageWithFiles(message: LLMMessage): Promise<Part[]> {
    const parts: Part[] = [];

    for (const attachment of message.attachments) {
      const attachmentUrl = attachment.storageUrl ?? attachment.presignedUrl;
      if (!attachmentUrl || !attachment.mimeType.startsWith('image/')) continue;

      const base64 = await fetchBase64FromPresignedUrl(attachmentUrl);
      parts.push({
        inlineData: { mimeType: attachment.mimeType, data: base64 },
      });
    }

    parts.push({ text: message.content });
    return parts;
  }
}

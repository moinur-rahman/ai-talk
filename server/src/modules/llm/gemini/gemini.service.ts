import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Content, Part, type ThinkingLevel } from '@google/genai';
import config from '../../../common/config/config.js';
import {
  LLMMessage,
  LLMRequest,
  StreamResult,
  TokenCallback,
} from '../types/llm.types.js';
import { LLMStrategy } from '../types/llm-strategy.interface.js';
import {
  buildSystemInstruction,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';
import { fetchBase64FromPresignedUrl } from '../llm.utils.js';

@Injectable()
export class GeminiService implements LLMStrategy {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<StreamResult> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const contents = await this.prepareContents(request.messages);

      const stream = await this.client.models.generateContentStream({
        model: request.model,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(request.systemPrompt),
          abortSignal: abortController.signal,
          ...(request.imageGenerationEnabled
            ? { responseModalities: ['Text', 'Image'] }
            : {}),
          ...(request.reasoningLevel
            ? {
                thinkingConfig: {
                  thinkingLevel: request.reasoningLevel as ThinkingLevel,
                  includeThoughts: true,
                },
              }
            : {}),
        },
      });

      let imageBase64: string | undefined;
      let lastUsageMetadata:
        | {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            thoughtsTokenCount?: number;
            totalTokenCount?: number;
          }
        | undefined;

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.thought) {
            await onToken(part.text ?? '', 'reasoningContent', false);
          } else if (part.inlineData?.mimeType?.startsWith('image/')) {
            imageBase64 = part.inlineData.data ?? undefined;
          } else if (part.text) {
            await onToken(part.text, 'mainContent', false);
          }
        }

        if (chunk.usageMetadata) {
          lastUsageMetadata = chunk.usageMetadata;
        }
      }

      await onToken('', 'mainContent', true);

      const usage = lastUsageMetadata
        ? {
            inputTokens: lastUsageMetadata.promptTokenCount ?? 0,
            outputTokens: lastUsageMetadata.candidatesTokenCount ?? 0,
            reasoningTokens: lastUsageMetadata.thoughtsTokenCount,
            totalTokens: lastUsageMetadata.totalTokenCount ?? 0,
            tokenSource: 'api' as const,
          }
        : undefined;

      return { imageBase64, usage };
    } catch (error) {
      if (abortController.signal.aborted) {
        await onToken('', 'mainContent', true);
        return {};
      } else {
        throw error;
      }
    } finally {
      this.activeStreams.delete(request.conversationId);
    }
  }

  async listModels(): Promise<{ name: string; description: string }[]> {
    try {
      const models: { name: string; description: string }[] = [];
      for await (const model of await this.client.models.list()) {
        const id = (model.name ?? '').replace(/^models\//, '');
        models.push({ name: id, description: model.displayName ?? '' });
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

import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import config from '../../../common/config/config.js';
import { LLMMessage, LLMRequest, TokenCallback } from '../types/llm.types.js';
import {
  buildSystemInstruction,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';
import { fetchBase64FromPresignedUrl } from '../llm.utils.js';

const REASONING_MODEL_PATTERNS = [
  /deepseek\/deepseek-r/i,
  /qwen\/qwq/i,
  /google\/gemini.*thinking/i,
  /anthropic\/claude.*3-7/i,
];

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenAI;
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const messages = await this.prepareMessages(
        request.messages,
        request.systemPrompt,
      );
      const reasoning = request.enableReasoning
        ? { effort: 'low' as const }
        : null;

      const stream = await this.client.chat.completions.create(
        {
          model: request.model,
          messages,
          stream: true,
          ...(reasoning && { reasoning }),
        },
        { signal: abortController.signal },
      );

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        const reasoning = (delta as { reasoning?: string }).reasoning;
        if (reasoning) {
          await onToken(reasoning, 'reasoningContent', false);
        }

        if (delta.content) {
          await onToken(delta.content, 'mainContent', false);
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
      for await (const model of this.client.models.list()) {
        models.push({
          name: model.id,
          description: '',
          hasReasoning: REASONING_MODEL_PATTERNS.some((p) => p.test(model.id)),
        });
      }
      return models;
    } catch (error) {
      this.logger.warn('Failed to list OpenRouter models', error);
      return [];
    }
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: TITLE_SYSTEM_PROMPT },
        { role: 'user', content: buildTitleUserPrompt(text) },
      ],
      stream: false,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
  }

  stopStream(conversationId: string): void {
    const abortController = this.activeStreams.get(conversationId);
    if (abortController) {
      abortController.abort();
      this.activeStreams.delete(conversationId);
    } else {
      this.logger.log(
        `No active OpenRouter stream found for conversation ${conversationId}`,
      );
    }
  }

  private async prepareMessages(
    messages: LLMMessage[],
    systemPrompt?: string,
  ): Promise<ChatCompletionMessageParam[]> {
    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: buildSystemInstruction(systemPrompt),
    };

    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments.length > 0) {
          const content = await this.processMessageWithFiles(message);
          return {
            role: message.senderType,
            content,
          } as ChatCompletionMessageParam;
        }
        return {
          role: message.senderType,
          content: message.content,
        } as ChatCompletionMessageParam;
      }),
    );

    return [systemMessage, ...processedMessages];
  }

  private async processMessageWithFiles(
    message: LLMMessage,
  ): Promise<ChatCompletionContentPart[]> {
    const parts: ChatCompletionContentPart[] = [];

    for (const attachment of message.attachments) {
      const attachmentUrl = attachment.storageUrl ?? attachment.presignedUrl;
      if (!attachmentUrl || !attachment.mimeType.startsWith('image/')) continue;

      const base64 = await fetchBase64FromPresignedUrl(attachmentUrl);
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${attachment.mimeType};base64,${base64}`,
          detail: 'low',
        },
      });
    }

    parts.push({ type: 'text', text: message.content });
    return parts;
  }
}

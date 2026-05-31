import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { ZAI_CLIENT } from '../../../providers/ai-client.tokens.js';
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
export class ZaiService implements LLMStrategy {
  private readonly logger = new Logger(ZaiService.name);
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor(@Inject(ZAI_CLIENT) private readonly client: OpenAI) {}

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<StreamResult> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const messages = await this.prepareMessages(
        request.messages,
        request.systemPrompt,
      );

      const stream = await this.client.chat.completions.create(
        {
          model: request.model,
          messages,
          stream: true,
          stream_options: { include_usage: true },
        },
        { signal: abortController.signal },
      );

      let inputTokens = 0;
      let outputTokens = 0;
      let totalTokens = 0;
      let gotUsage = false;

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          await onToken(delta.content, 'mainContent', false);
        }

        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
          totalTokens = chunk.usage.total_tokens;
          gotUsage = true;
        }
      }

      await onToken('', 'mainContent', true);
      return {
        usage: gotUsage
          ? {
              inputTokens,
              outputTokens,
              totalTokens,
              tokenSource: 'api' as const,
            }
          : undefined,
      };
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
      for await (const model of this.client.models.list()) {
        models.push({ name: model.id, description: '' });
      }
      return models;
    } catch (error) {
      this.logger.warn('Failed to list Z.AI models', error);
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
        `No active Z.AI stream found for conversation ${conversationId}`,
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

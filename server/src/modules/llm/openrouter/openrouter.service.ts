import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import { OPENROUTER_CLIENT } from '../../../providers/ai-client.tokens.js';
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

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; imageUrl: { url: string; detail: 'low' } };

@Injectable()
export class OpenRouterService implements LLMStrategy {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor(@Inject(OPENROUTER_CLIENT) private readonly client: OpenRouter) {}

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
      const reasoning = request.reasoningLevel
        ? { effort: 'low' as const }
        : undefined;

      const stream = await this.client.chat.send(
        {
          chatRequest: {
            model: request.model,
            messages,
            stream: true,
            ...(reasoning && { reasoning }),
          },
        },
        { signal: abortController.signal },
      );

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        if (delta.reasoning) {
          await onToken(delta.reasoning, 'reasoningContent', false);
        }

        if (delta.content) {
          await onToken(delta.content, 'mainContent', false);
        }
      }

      await onToken('', 'mainContent', true);
      return {};
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
      const result = await this.client.models.list();
      return result.data.map((model) => ({
        name: model.id,
        description: model.description ?? '',
      }));
    } catch (error) {
      this.logger.warn('Failed to list OpenRouter models', error);
      return [];
    }
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.chat.send({
      chatRequest: {
        model,
        messages: [
          { role: 'system', content: TITLE_SYSTEM_PROMPT },
          { role: 'user', content: buildTitleUserPrompt(text) },
        ],
        stream: false,
      },
    });

    const raw: unknown = response.choices[0]?.message?.content;
    return (typeof raw === 'string' ? raw : null)?.trim() ?? '';
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

  private async prepareMessages(messages: LLMMessage[], systemPrompt?: string) {
    const systemMessage = {
      role: 'system' as const,
      content: buildSystemInstruction(systemPrompt),
    };

    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments.length > 0) {
          const content = await this.processMessageWithFiles(message);
          return {
            role: message.senderType,
            content,
          };
        }
        return {
          role: message.senderType,
          content: message.content,
        };
      }),
    );

    return [systemMessage, ...processedMessages];
  }

  private async processMessageWithFiles(
    message: LLMMessage,
  ): Promise<ContentPart[]> {
    const parts: ContentPart[] = [];

    for (const attachment of message.attachments) {
      const attachmentUrl = attachment.storageUrl ?? attachment.presignedUrl;
      if (!attachmentUrl || !attachment.mimeType.startsWith('image/')) continue;

      const base64 = await fetchBase64FromPresignedUrl(attachmentUrl);
      parts.push({
        type: 'image_url',
        imageUrl: {
          url: `data:${attachment.mimeType};base64,${base64}`,
          detail: 'low',
        },
      });
    }

    parts.push({ type: 'text', text: message.content });
    return parts;
  }
}

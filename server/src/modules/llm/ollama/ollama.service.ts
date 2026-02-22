import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import config from '../../../common/config/config.js';
import { LLMRequest, TokenCallback } from '../types/llm.types.js';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly client: Ollama;
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.client = new Ollama({ host: config.ollamaHost });
  }

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const messages = request.messages.map((m) => ({
        role: m.senderType,
        content: m.content,
      }));

      const stream = await this.client.chat({
        model: request.model,
        messages,
        stream: true,
        think: request.enableReasoning,
      });

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        const { content, thinking } = chunk.message;

        if (thinking) {
          await onToken(thinking, 'reasoningContent', false);
        }
        if (content) {
          await onToken(content, 'mainContent', false);
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

  stopStream(conversationId: string): void {
    const abortController = this.activeStreams.get(conversationId);
    if (abortController) {
      abortController.abort();
      this.activeStreams.delete(conversationId);
    } else {
      this.logger.log(
        `No active Ollama stream found for conversation ${conversationId}`,
      );
    }
  }

  async listModels(): Promise<
    { name: string; description: string; hasReasoning: boolean }[]
  > {
    try {
      const response = await this.client.list();
      return response.models.map((model) => {
        const { family, parameter_size, families } = model.details;
        const parts = [family, parameter_size].filter(Boolean);
        const description = parts.length > 0 ? parts.join(' · ') : model.name;
        const hasReasoning = this.isReasoningModel(
          model.name,
          family,
          families,
        );
        return { name: model.name, description, hasReasoning };
      });
    } catch (error) {
      this.logger.warn('Failed to list Ollama models', error);
      return [];
    }
  }

  private isReasoningModel(
    name: string,
    family: string,
    families: string[] | null,
  ): boolean {
    const reasoningPatterns = ['deepseek-r1', 'qwq', 'marco-o1'];
    const matches = (s: string) =>
      reasoningPatterns.some((p) => s.toLowerCase().includes(p));
    return (
      matches(name) || matches(family) || (families?.some(matches) ?? false)
    );
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.chat({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You must strictly limit your response to 3–5 words. Do not exceed this limit.',
        },
        {
          role: 'user',
          content: `Generate a short title for the following conversation. Strictly adhere to the limit of 3–5 words. Conversation:\n\n${text}`,
        },
      ],
      stream: false,
    });

    return response.message.content?.trim() || '';
  }
}

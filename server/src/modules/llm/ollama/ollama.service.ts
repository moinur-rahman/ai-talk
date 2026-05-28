import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from '../../../providers/ai-client.tokens.js';
import { LLMRequest, StreamResult, TokenCallback } from '../types/llm.types.js';
import { LLMStrategy } from '../types/llm-strategy.interface.js';
import {
  buildSystemInstruction,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';

@Injectable()
export class OllamaService implements LLMStrategy {
  private readonly logger = new Logger(OllamaService.name);
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor(@Inject(OLLAMA_CLIENT) private readonly client: Ollama) {}

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<StreamResult> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const systemMessage = {
        role: 'system',
        content: buildSystemInstruction(request.systemPrompt),
      };
      const messages = [
        systemMessage,
        ...request.messages.map((m) => ({
          role: m.senderType,
          content: m.content,
        })),
      ];

      const stream = await this.client.chat({
        model: request.model,
        messages,
        stream: true,
        think: !!request.reasoningLevel,
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

  async listModels(): Promise<{ name: string; description: string }[]> {
    try {
      const response = await this.client.list();
      return response.models.map((model) => {
        const { family, parameter_size } = model.details;
        const parts = [family, parameter_size].filter(Boolean);
        const description = parts.length > 0 ? parts.join(' · ') : model.name;
        return { name: model.name, description };
      });
    } catch (error) {
      this.logger.warn('Failed to list Ollama models', error);
      return [];
    }
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.chat({
      model,
      messages: [
        { role: 'system', content: TITLE_SYSTEM_PROMPT },
        { role: 'user', content: buildTitleUserPrompt(text) },
      ],
      stream: false,
    });

    return response.message.content?.trim() || '';
  }
}

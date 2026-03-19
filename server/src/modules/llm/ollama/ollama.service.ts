import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import config from '../../../common/config/config.js';
import { LLMRequest, TokenCallback } from '../types/llm.types.js';
import {
  buildSystemInstruction,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';

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

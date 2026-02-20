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

  async streamResponse(request: LLMRequest, onToken: TokenCallback): Promise<void> {
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
      this.logger.log(`No active Ollama stream found for conversation ${conversationId}`);
    }
  }

  async generateConversationTitle(conversationText: string): Promise<string> {
    const response = await this.client.chat({
      model: 'llama3.2:1b',
      messages: [
        {
          role: 'system',
          content:
            'You must strictly limit your response to 3–5 words. Do not exceed this limit.',
        },
        {
          role: 'user',
          content: `Generate a short title for the following conversation. Strictly adhere to the limit of 3–5 words. Conversation:\n\n${conversationText}`,
        },
      ],
      stream: false,
    });

    let title = response.message.content?.trim() || '';
    title = title.replace(/^["']|["']$/g, '');

    const words = title.split(/\s+/);
    if (words.length > 5) {
      title = words.slice(0, 5).join(' ');
    }
    if (title.length > 50) {
      title = title.slice(0, 47) + '...';
    }

    return title.trim();
  }
}

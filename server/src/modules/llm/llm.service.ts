import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama/ollama.service.js';
import { OpenAIService } from './openai/openai.service.js';
import { OpenRouterService } from './openrouter/openrouter.service.js';
import { LLMRequest, TokenCallback } from './types/llm.types.js';
import config from '../../common/config/config.js';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly openAIService: OpenAIService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  async streamResponse(
    providerName: string,
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<void> {
    const provider = providerName.toLowerCase();

    if (provider === 'openai') {
      await this.openAIService.streamResponse(request, onToken);
    } else if (provider === 'ollama') {
      await this.ollamaService.streamResponse(request, onToken);
    } else if (provider === 'openrouter') {
      await this.openRouterService.streamResponse(request, onToken);
    } else {
      throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  stopStream(providerName: string, conversationId: string): void {
    const provider = providerName.toLowerCase();

    if (provider === 'openai') {
      this.openAIService.stopStream(conversationId);
    } else if (provider === 'ollama') {
      this.ollamaService.stopStream(conversationId);
    } else if (provider === 'openrouter') {
      this.openRouterService.stopStream(conversationId);
    } else {
      this.logger.warn(`Cannot stop stream: unknown provider ${providerName}`);
    }
  }

  async generateConversationTitle(conversationText: string): Promise<string> {
    const provider = config.titleGenerationProvider.toLowerCase();
    const model = config.titleGenerationModel;

    let rawTitle: string;
    if (provider === 'openai') {
      rawTitle = await this.openAIService.generateTitle(
        conversationText,
        model,
      );
    } else if (provider === 'openrouter') {
      rawTitle = await this.openRouterService.generateTitle(
        conversationText,
        model,
      );
    } else {
      rawTitle = await this.ollamaService.generateTitle(
        conversationText,
        model,
      );
    }

    return this.formatTitle(rawTitle);
  }

  private formatTitle(title: string): string {
    title = title.replace(/^["']|["']$/g, '');
    const words = title.split(/\s+/);
    if (words.length > 5) title = words.slice(0, 5).join(' ');
    if (title.length > 50) title = title.slice(0, 47) + '...';
    return title.trim();
  }
}

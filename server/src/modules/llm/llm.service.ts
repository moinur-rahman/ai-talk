import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama/ollama.service.js';
import { OpenAIService } from './openai/openai.service.js';
import { OpenRouterService } from './openrouter/openrouter.service.js';
import { LLMRequest, TokenCallback } from './types/llm.types.js';
import config from '../../common/config/config.js';
import { PROVIDER } from '../../common/constants/providers.js';

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
    switch (providerName.toLowerCase()) {
      case PROVIDER.OPENAI:
        await this.openAIService.streamResponse(request, onToken);
        break;
      case PROVIDER.OLLAMA:
        await this.ollamaService.streamResponse(request, onToken);
        break;
      case PROVIDER.OPENROUTER:
        await this.openRouterService.streamResponse(request, onToken);
        break;
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  stopStream(providerName: string, conversationId: string): void {
    switch (providerName.toLowerCase()) {
      case PROVIDER.OPENAI:
        this.openAIService.stopStream(conversationId);
        break;
      case PROVIDER.OLLAMA:
        this.ollamaService.stopStream(conversationId);
        break;
      case PROVIDER.OPENROUTER:
        this.openRouterService.stopStream(conversationId);
        break;
      default:
        this.logger.warn(
          `Cannot stop stream: unknown provider ${providerName}`,
        );
    }
  }

  async generateConversationTitle(conversationText: string): Promise<string> {
    const provider = config.titleGenerationProvider.toLowerCase();
    const model = config.titleGenerationModel;

    try {
      let rawTitle: string;
      switch (provider) {
        case PROVIDER.OPENAI:
          rawTitle = await this.openAIService.generateTitle(
            conversationText,
            model,
          );
          break;
        case PROVIDER.OPENROUTER:
          rawTitle = await this.openRouterService.generateTitle(
            conversationText,
            model,
          );
          break;
        case PROVIDER.OLLAMA:
          rawTitle = await this.ollamaService.generateTitle(
            conversationText,
            model,
          );
          break;
        default:
          throw new Error(`Unknown title generation provider: ${provider}`);
      }
      return this.formatTitle(rawTitle);
    } catch (error) {
      this.logger.warn(
        `Title generation failed: ${error instanceof Error ? error.message : String(error)}. Using first message as fallback.`,
      );
      return this.formatTitle(conversationText);
    }
  }

  private formatTitle(title: string): string {
    title = title.replace(/^["']|["']$/g, '');
    const words = title.split(/\s+/);
    if (words.length > 5) title = words.slice(0, 5).join(' ');
    if (title.length > 50) title = title.slice(0, 47) + '...';
    return title.trim();
  }
}

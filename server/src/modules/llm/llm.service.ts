import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama/ollama.service.js';
import { OpenAIService } from './openai/openai.service.js';
import { OpenRouterService } from './openrouter/openrouter.service.js';
import { ZaiService } from './zai/zai.service.js';
import { GeminiService } from './gemini/gemini.service.js';
import { LLMRequest, StreamResult, TokenCallback } from './types/llm.types.js';
import { LLMStrategy } from './types/llm-strategy.interface.js';
import config from '../../common/config/config.js';
import { PROVIDER } from '../../common/constants/providers.js';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly strategies: Map<string, LLMStrategy>;

  constructor(
    ollamaService: OllamaService,
    openAIService: OpenAIService,
    openRouterService: OpenRouterService,
    zaiService: ZaiService,
    geminiService: GeminiService,
  ) {
    this.strategies = new Map<string, LLMStrategy>([
      [PROVIDER.OPENAI, openAIService],
      [PROVIDER.OLLAMA, ollamaService],
      [PROVIDER.OPENROUTER, openRouterService],
      [PROVIDER.ZAI, zaiService],
      [PROVIDER.GEMINI, geminiService],
    ]);
  }

  async streamResponse(
    providerName: string,
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<StreamResult> {
    return this.getStrategy(providerName).streamResponse(request, onToken);
  }

  stopStream(providerName: string, conversationId: string): void {
    try {
      this.getStrategy(providerName).stopStream(conversationId);
    } catch {
      this.logger.warn(`Cannot stop stream: unknown provider ${providerName}`);
    }
  }

  async generateConversationTitle(conversationText: string): Promise<string> {
    const provider = config.titleGenerationProvider.toLowerCase();
    const model = config.titleGenerationModel;

    try {
      const rawTitle = await this.getStrategy(provider).generateTitle(
        conversationText,
        model,
      );
      return this.formatTitle(rawTitle);
    } catch (error) {
      this.logger.warn(
        `Title generation failed: ${error instanceof Error ? error.message : String(error)}. Using first message as fallback.`,
      );
      return this.formatTitle(conversationText);
    }
  }

  private getStrategy(providerName: string): LLMStrategy {
    const strategy = this.strategies.get(providerName.toLowerCase());
    if (!strategy) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    return strategy;
  }

  private formatTitle(title: string): string {
    title = title.replace(/^["']|["']$/g, '');
    const words = title.split(/\s+/);
    if (words.length > 5) title = words.slice(0, 5).join(' ');
    if (title.length > 50) title = title.slice(0, 47) + '...';
    return title.trim();
  }
}

import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { OllamaService } from './ollama/ollama.service.js';
import { OpenAIService } from './openai/openai.service.js';
import { OpenRouterService } from './openrouter/openrouter.service.js';
import { ZaiService } from './zai/zai.service.js';

@Module({
  providers: [LlmService, OllamaService, OpenAIService, OpenRouterService, ZaiService],
  exports: [LlmService, OllamaService, OpenAIService, OpenRouterService, ZaiService],
})
export class LlmModule {}

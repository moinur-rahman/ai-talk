import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { OllamaService } from './ollama/ollama.service.js';
import { OpenAIService } from './openai/openai.service.js';

@Module({
  providers: [LlmService, OllamaService, OpenAIService],
  exports: [LlmService, OllamaService, OpenAIService],
})
export class LlmModule {}

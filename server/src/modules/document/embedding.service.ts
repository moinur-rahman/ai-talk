import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Ollama } from 'ollama';
import config from '../../common/config/config.js';
import {
  OLLAMA_CLIENT,
  OPENAI_CLIENT,
  OPENROUTER_CLIENT,
} from '../../providers/ai-client.tokens.js';

@Injectable()
export class EmbeddingService {
  private readonly openAICompatibleClient: OpenAI | undefined;
  private readonly ollamaClient: Ollama | undefined;

  constructor(
    @Inject(OPENAI_CLIENT) openaiClient: OpenAI,
    @Inject(OPENROUTER_CLIENT) openrouterClient: OpenAI,
    @Inject(OLLAMA_CLIENT) ollamaClient: Ollama,
  ) {
    if (config.embeddingProvider === 'openai') {
      this.openAICompatibleClient = openaiClient;
    } else if (config.embeddingProvider === 'openrouter') {
      this.openAICompatibleClient = openrouterClient;
    } else if (config.embeddingProvider === 'ollama') {
      this.ollamaClient = ollamaClient;
    } else {
      throw new Error(
        `Unknown embedding provider: "${config.embeddingProvider}". Supported values: "openai", "openrouter", "ollama"`,
      );
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (this.openAICompatibleClient) {
      return this.embedWithOpenAICompatible(text);
    }

    if (this.ollamaClient) {
      return this.embedWithOllama(text);
    }

    throw new Error('No embedding client configured');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (this.openAICompatibleClient) {
      return this.embedBatchWithOpenAICompatible(texts);
    }

    if (this.ollamaClient) {
      return this.embedBatchWithOllama(texts);
    }

    throw new Error('No embedding client configured');
  }

  private async embedWithOpenAICompatible(text: string): Promise<number[]> {
    const response = await this.openAICompatibleClient!.embeddings.create({
      model: config.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  private async embedBatchWithOpenAICompatible(
    texts: string[],
    subBatchSize: number = 20,
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += subBatchSize) {
      const subBatch = texts.slice(i, i + subBatchSize);
      const response = await this.openAICompatibleClient!.embeddings.create({
        model: config.embeddingModel,
        input: subBatch,
      });
      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
      results.push(...embeddings);
    }

    return results;
  }

  private async embedBatchWithOllama(texts: string[]): Promise<number[][]> {
    const response = await this.ollamaClient!.embed({
      model: config.embeddingModel,
      input: texts,
    });
    return response.embeddings;
  }

  private async embedWithOllama(text: string): Promise<number[]> {
    const response = await this.ollamaClient!.embed({
      model: config.embeddingModel,
      input: text,
    });
    return response.embeddings[0];
  }
}

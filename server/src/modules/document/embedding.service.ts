import { Inject, Injectable } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
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
  private readonly openaiClient: OpenAI | undefined;
  private readonly openrouterClient: OpenRouter | undefined;
  private readonly ollamaClient: Ollama | undefined;

  constructor(
    @Inject(OPENAI_CLIENT) openaiClient: OpenAI,
    @Inject(OPENROUTER_CLIENT) openrouterClient: OpenRouter,
    @Inject(OLLAMA_CLIENT) ollamaClient: Ollama,
  ) {
    if (config.embeddingProvider === 'openai') {
      this.openaiClient = openaiClient;
    } else if (config.embeddingProvider === 'openrouter') {
      this.openrouterClient = openrouterClient;
    } else if (config.embeddingProvider === 'ollama') {
      this.ollamaClient = ollamaClient;
    } else {
      throw new Error(
        `Unknown embedding provider: "${config.embeddingProvider}". Supported values: "openai", "openrouter", "ollama"`,
      );
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (this.openaiClient) {
      return this.embedWithOpenAI(text);
    }

    if (this.openrouterClient) {
      return this.embedWithOpenRouter(text);
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

    if (this.openaiClient) {
      return this.embedBatchWithOpenAI(texts);
    }

    if (this.openrouterClient) {
      return this.embedBatchWithOpenRouter(texts);
    }

    if (this.ollamaClient) {
      return this.embedBatchWithOllama(texts);
    }

    throw new Error('No embedding client configured');
  }

  private async embedWithOpenAI(text: string): Promise<number[]> {
    const response = await this.openaiClient!.embeddings.create({
      model: config.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  private async embedBatchWithOpenAI(
    texts: string[],
    subBatchSize: number = 20,
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += subBatchSize) {
      const subBatch = texts.slice(i, i + subBatchSize);
      const response = await this.openaiClient!.embeddings.create({
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

  private async embedWithOpenRouter(text: string): Promise<number[]> {
    const response = await this.openrouterClient!.embeddings.generate({
      requestBody: { model: config.embeddingModel, input: text },
    });
    if (typeof response === 'string') {
      throw new Error(
        'Unexpected string response from OpenRouter embeddings API',
      );
    }
    return response.data[0].embedding as number[];
  }

  private async embedBatchWithOpenRouter(
    texts: string[],
    subBatchSize: number = 20,
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += subBatchSize) {
      const subBatch = texts.slice(i, i + subBatchSize);
      const response = await this.openrouterClient!.embeddings.generate({
        requestBody: { model: config.embeddingModel, input: subBatch },
      });
      if (typeof response === 'string') {
        throw new Error(
          'Unexpected string response from OpenRouter embeddings API',
        );
      }
      const embeddings = response.data
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((item) => item.embedding as number[]);
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

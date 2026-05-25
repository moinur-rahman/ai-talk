import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Ollama } from 'ollama';
import config from '../../common/config/config.js';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openaiClient?: OpenAI;
  private readonly ollamaClient?: Ollama;

  constructor() {
    if (config.embeddingProvider === 'openai') {
      this.openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    } else if (config.embeddingProvider === 'ollama') {
      this.ollamaClient = new Ollama({ host: config.ollamaHost });
    } else {
      throw new Error(
        `Unknown embedding provider: "${config.embeddingProvider}". Supported values: "openai", "ollama"`,
      );
    }
  }

  /**
   * Generate an embedding vector for a single text string.
   */
  async embedText(text: string): Promise<number[]> {
    if (this.openaiClient) {
      return this.embedWithOpenAI(text);
    }

    if (this.ollamaClient) {
      return this.embedWithOllama(text);
    }

    throw new Error('No embedding client configured');
  }

  /**
   * Generate embedding vectors for multiple texts.
   * OpenAI supports batching; Ollama is called sequentially.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (this.openaiClient) {
      return this.embedBatchWithOpenAI(texts);
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

  private async embedBatchWithOpenAI(texts: string[]): Promise<number[][]> {
    const response = await this.openaiClient!.embeddings.create({
      model: config.embeddingModel,
      input: texts,
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
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

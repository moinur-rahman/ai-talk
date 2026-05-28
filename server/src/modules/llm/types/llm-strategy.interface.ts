import { LLMRequest, StreamResult, TokenCallback } from './llm.types.js';

export interface LLMStrategy {
  streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<StreamResult>;
  stopStream(conversationId: string): void;
  generateTitle(text: string, model: string): Promise<string>;
  listModels(): Promise<{ name: string; description: string }[]>;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  presignedUrl?: string;
}

export interface LLMMessage {
  content: string;
  senderType: 'user' | 'assistant';
  attachments: FileMetadata[];
}

export interface LLMRequest {
  model: string;
  conversationId: string;
  messages: LLMMessage[];
  enableReasoning: boolean;
}

export type TokenType = 'mainContent' | 'reasoningContent';

export type TokenCallback = (
  token: string,
  tokenType: TokenType,
  isEnd: boolean,
) => Promise<void>;

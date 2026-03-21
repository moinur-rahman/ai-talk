export interface FileMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  presignedUrl?: string;
  storageUrl?: string;
}

export interface LLMMessage {
  content: string;
  senderType: 'user' | 'assistant';
  attachments: FileMetadata[];
  openaiImageCallId?: string | null;
}

export interface LLMRequest {
  model: string;
  conversationId: string;
  messages: LLMMessage[];
  enableReasoning: boolean;
  systemPrompt?: string;
}

export type TokenType = 'mainContent' | 'reasoningContent' | 'partialImage';

export type TokenCallback = (
  token: string,
  tokenType: TokenType,
  isEnd: boolean,
) => void | Promise<void>;

export interface StreamResult {
  openaiImageCallId?: string;
}

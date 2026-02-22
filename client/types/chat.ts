export interface FileMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  presignedUrl?: string;
}

export interface Message {
  mainContent?: string;
  reasoningContent?: string;
  senderType: 'user' | 'assistant';
  attachments?: FileMetadata[];
}

export interface Conversation {
  id: string;
  title: string;
}

export interface GetConversationsResponse {
  data: Conversation[];
  messageCode: string;
}

export interface ChatHistoryResponse {
  data: {
    messages: Message[];
    lastModelAndProvider: {
      lastModelId: string;
      lastProviderId: string;
    };
    messageCode: string;
  };
}

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

export interface ConversationsPage {
  conversations: Conversation[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface GetConversationsPageResponse {
  data: ConversationsPage;
  messageCode: string;
}

export interface ConversationSearchResult {
  id: string;
  title: string | null;
  snippet: string | null;
}

export interface SearchConversationsResponse {
  data: ConversationSearchResult[];
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

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { conversations: number };
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  instructions?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  instructions?: string;
}

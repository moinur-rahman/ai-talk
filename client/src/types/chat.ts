export type RagStatus = 'processing' | 'completed' | 'skipped' | 'failed';

export interface FileMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  presignedUrl?: string;
  ragStatus?: RagStatus | null;
}

export interface Message {
  id?: string;
  mainContent?: string;
  reasoningContent?: string;
  generatedImage?: string;
  senderType: 'user' | 'assistant';
  inputType: 'text' | 'voice';
  audioDurationMs?: number | null;
  modelId?: string | null;
  attachments?: FileMetadata[];
  parentMessageId?: string | null;
  siblingIds?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  projectId: string | null;
}

export interface ConversationDetail {
  id: string;
  title: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
}

export interface ConversationsPage {
  conversations: Conversation[];
  hasNextPage: boolean;
  nextCursor: string | null;
  total?: number;
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
    title: string | null;
    project: { id: string; name: string } | null;
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

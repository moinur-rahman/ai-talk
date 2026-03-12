import axiosInstance from '@/apis/axiosInstance';

interface CreateConversationResponse {
  data: {
    conversationId: string;
  };
  messageCode: string;
}

export const createConversation = async (
  projectId?: string,
): Promise<string> => {
  try {
    const response = await axiosInstance.post<CreateConversationResponse>(
      '/chats/conversations',
      projectId ? { projectId } : {},
    );

    return response.data.data.conversationId;
  } catch (error) {
    console.log('Failed to create conversation:', error);
    throw error;
  }
};

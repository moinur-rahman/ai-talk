import axiosInstance from '@/apis/axiosInstance';

interface CreateConversationResponse {
  data: {
    conversationId: string;
  };
  messageCode: string;
}

export const createConversation = async (): Promise<string> => {
  try {
    const response = await axiosInstance.post<CreateConversationResponse>(
      '/chats/conversations',
    );

    return response.data.data.conversationId;
  } catch (error) {
    console.log('Failed to create conversation:', error);
    throw error;
  }
};

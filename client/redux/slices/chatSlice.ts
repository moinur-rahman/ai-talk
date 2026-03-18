import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '@/types/chat';

interface ChatState {
  chatHistories: Record<string, Message[]>;
  newConversationId: string | null;
  newConversationTitle: string | null;
  newConversationProject: { id: string; name: string } | null;
}

const initialState: ChatState = {
  chatHistories: {},
  newConversationId: null,
  newConversationTitle: null,
  newConversationProject: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>,
    ) => {
      const { conversationId, message } = action.payload;
      if (!state.chatHistories[conversationId]) {
        state.chatHistories[conversationId] = [];
      }
      const messageWithFiles = {
        ...message,
        attachments: message.attachments || [],
      };
      state.chatHistories[conversationId].push(messageWithFiles);
    },

    updateLastMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        token: string;
        tokenType?: 'mainContent' | 'reasoningContent';
      }>,
    ) => {
      const { conversationId, token, tokenType } = action.payload;
      const messages = state.chatHistories[conversationId];
      if (messages && messages.length > 0) {
        const last = messages[messages.length - 1];
        if (last.senderType === 'assistant') {
          if (tokenType === 'mainContent') {
            last.mainContent += token;
          }
          if (tokenType === 'reasoningContent') {
            last.reasoningContent += token;
          }
        }
      }
    },

    loadChatHistory: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messages: Message[];
      }>,
    ) => {
      state.chatHistories[action.payload.conversationId] =
        action.payload.messages;
    },

    setNewConversationId: (state, action: PayloadAction<string | null>) => {
      state.newConversationId = action.payload;
      if (action.payload === null) {
        state.newConversationTitle = null;
        state.newConversationProject = null;
      }
    },

    setNewConversationTitle: (state, action: PayloadAction<string | null>) => {
      state.newConversationTitle = action.payload;
    },

    setNewConversationProject: (
      state,
      action: PayloadAction<{ id: string; name: string } | null>,
    ) => {
      state.newConversationProject = action.payload;
    },

    removeConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      if (state.chatHistories[conversationId]) {
        const { [conversationId]: _, ...rest } = state.chatHistories;
        state.chatHistories = rest;
      }
    },
  },
});

export const {
  addMessage,
  updateLastMessage,
  loadChatHistory,
  setNewConversationId,
  setNewConversationTitle,
  setNewConversationProject,
  removeConversation,
} = chatSlice.actions;
export default chatSlice.reducer;

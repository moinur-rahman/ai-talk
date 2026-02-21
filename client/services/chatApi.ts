import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Conversation,
  ChatHistoryResponse,
  GetConversationsResponse,
} from "@/types/chat";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
    credentials: "include",
  }),
  tagTypes: ["ChatHistory"],
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => "/chats/conversations",
      transformResponse: (response: GetConversationsResponse) =>
        response.data ?? [],
    }),
    getChatHistory: builder.query<ChatHistoryResponse["data"], string>({
      query: (conversationId) => `/chats/messages/${conversationId}`,
      transformResponse: (response: ChatHistoryResponse) => response.data,
      providesTags: (result, error, conversationId) => [
        { type: "ChatHistory", id: conversationId },
      ],
    }),
  }),
});

export const { useGetConversationsQuery, useGetChatHistoryQuery } = chatApi;

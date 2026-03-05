import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  ConversationsPage,
  ChatHistoryResponse,
  GetConversationsPageResponse,
} from '@/types/chat';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
    credentials: 'include',
  }),
  tagTypes: ['ChatHistory'],
  endpoints: (builder) => ({
    getConversations: builder.infiniteQuery<
      ConversationsPage,
      void,
      string | null
    >({
      query: ({ pageParam }) => ({
        url: '/chats/conversations',
        params: {
          limit: 30,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
      transformResponse: (response: GetConversationsPageResponse) =>
        response.data,
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    }),
    getChatHistory: builder.query<ChatHistoryResponse['data'], string>({
      query: (conversationId) => `/chats/messages/${conversationId}`,
      transformResponse: (response: ChatHistoryResponse) => response.data,
      providesTags: (result, error, conversationId) => [
        { type: 'ChatHistory', id: conversationId },
      ],
    }),
  }),
});

export const { useGetConversationsInfiniteQuery, useGetChatHistoryQuery } =
  chatApi;

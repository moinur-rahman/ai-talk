import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  ConversationsPage,
  ChatHistoryResponse,
  GetConversationsPageResponse,
  ConversationSearchResult,
  SearchConversationsResponse,
} from '@/types/chat';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
    credentials: 'include',
  }),
  tagTypes: ['ChatHistory', 'Conversations'],
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
      providesTags: ['Conversations'],
    }),
    searchConversations: builder.query<ConversationSearchResult[], string>({
      query: (q) => ({
        url: '/chats/conversations/search',
        params: { q },
      }),
      transformResponse: (response: SearchConversationsResponse) =>
        response.data,
    }),
    deleteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/chats/conversations/${conversationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversations'],
    }),
    deleteAllConversations: builder.mutation<void, void>({
      query: () => ({
        url: '/chats/conversations',
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversations'],
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

export const {
  useGetConversationsInfiniteQuery,
  useSearchConversationsQuery,
  useGetChatHistoryQuery,
  useDeleteConversationMutation,
  useDeleteAllConversationsMutation,
} = chatApi;

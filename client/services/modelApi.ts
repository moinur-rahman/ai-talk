import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Model {
  id: string;
  name: string;
  hasReasoning: boolean;
}

export interface AdminModel {
  id: string;
  name: string;
  description: string;
  hasReasoning: boolean;
  isDeprecated: boolean;
  isEnabled: boolean;
}

export interface Provider {
  id: string;
  name: string;
}

export interface AdminProvider {
  id: string;
  name: string;
  models: AdminModel[];
}

interface FetchModelsResponse {
  data: Model[];
  messageCode: string;
}

interface FetchProvidersResponse {
  data: Provider[];
  messageCode: string;
}

interface FetchAdminOverviewResponse {
  data: AdminProvider[];
  message: string;
}

export interface SyncResult {
  provider: string;
  created?: number;
  updated?: number;
  deprecated?: number;
  error?: string;
}

interface SyncModelsResponse {
  data: { results: SyncResult[] };
  message: string;
}

export interface CreateModelPayload {
  name: string;
  description?: string;
  hasReasoning?: boolean;
  isEnabled?: boolean;
  providerId: string;
}

export interface UpdateModelPayload {
  modelId: string;
  name?: string;
  description?: string;
  hasReasoning?: boolean;
  isEnabled?: boolean;
}

interface AdminModelResponse {
  data: AdminModel;
  message: string;
}

export const modelApi = createApi({
  reducerPath: 'modelApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/models`,
    credentials: 'include',
  }),
  tagTypes: ['AdminOverview'],
  endpoints: (builder) => ({
    getProviders: builder.query<Provider[], void>({
      query: () => '/providers',
      transformResponse: (response: FetchProvidersResponse) => response.data,
    }),
    getModels: builder.query<Model[], string>({
      query: (providerId) => `/list/${providerId}`,
      transformResponse: (response: FetchModelsResponse) => response.data,
    }),
    getAdminOverview: builder.query<AdminProvider[], void>({
      query: () => '/admin/overview',
      transformResponse: (response: FetchAdminOverviewResponse) =>
        response.data,
      providesTags: ['AdminOverview'],
    }),
    syncModels: builder.mutation<SyncModelsResponse, void>({
      query: () => ({ url: '/admin/sync', method: 'POST' }),
      invalidatesTags: ['AdminOverview'],
    }),
    createModel: builder.mutation<AdminModelResponse, CreateModelPayload>({
      query: (body) => ({ url: '/admin/create', method: 'POST', body }),
      invalidatesTags: ['AdminOverview'],
    }),
    updateModel: builder.mutation<AdminModelResponse, UpdateModelPayload>({
      query: ({ modelId, ...body }) => ({
        url: `/admin/${modelId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminOverview'],
    }),
  }),
});

export const {
  useGetProvidersQuery,
  useGetModelsQuery,
  useGetAdminOverviewQuery,
  useSyncModelsMutation,
  useCreateModelMutation,
  useUpdateModelMutation,
} = modelApi;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Model {
  id: string;
  name: string;
  provider: {
    id: string;
    name: string;
  };
}

export interface AdminModel {
  id: string;
  name: string;
  description: string;
  isDeprecated: boolean;
  isEnabled: boolean;
}

export interface AdminProvider {
  id: string;
  name: string;
  models: AdminModel[];
}

interface FetchAllModelsResponse {
  data: Model[];
  message: string;
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
  isEnabled?: boolean;
  providerId: string;
}

export interface UpdateModelPayload {
  modelId: string;
  name?: string;
  description?: string;
  isEnabled?: boolean;
}

interface AdminModelResponse {
  data: AdminModel;
  message: string;
}

export const modelApi = createApi({
  reducerPath: 'modelApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/models`,
    credentials: 'include',
  }),
  tagTypes: ['AdminOverview'],
  endpoints: (builder) => ({
    getAllModels: builder.query<Model[], void>({
      query: () => '/list',
      transformResponse: (response: FetchAllModelsResponse) => response.data,
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
  useGetAllModelsQuery,
  useGetAdminOverviewQuery,
  useSyncModelsMutation,
  useCreateModelMutation,
  useUpdateModelMutation,
} = modelApi;

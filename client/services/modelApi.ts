import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Model {
  id: string;
  name: string;
  hasReasoning: boolean;
}

export interface Provider {
  id: string;
  name: string;
}

interface FetchModelsResponse {
  data: Model[];
  messageCode: string;
}

interface FetchProvidersResponse {
  data: Provider[];
  messageCode: string;
}

export const modelApi = createApi({
  reducerPath: 'modelApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/models`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getProviders: builder.query<Provider[], void>({
      query: () => '/providers',
      transformResponse: (response: FetchProvidersResponse) => response.data,
    }),
    getModels: builder.query<Model[], string>({
      query: (providerId) => `/list/${providerId}`,
      transformResponse: (response: FetchModelsResponse) => response.data,
    }),
  }),
});

export const { useGetProvidersQuery, useGetModelsQuery } = modelApi;

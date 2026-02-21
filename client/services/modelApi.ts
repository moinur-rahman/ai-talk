import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

interface UpdateDefaultModelRequest {
  modelId: string;
  providerId: string;
}

interface UpdateDefaultModelResponse {
  data: {
    id: string;
    userId: string;
    modelId: string;
    providerId: string;
  };
  messageCode: string;
}

interface DefaultModelResponse {
  data: {
    modelId: string;
    providerId: string;
  } | null;
  messageCode: string;
}

export const modelApi = createApi({
  reducerPath: "modelApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/models`,
    credentials: "include",
  }),
  tagTypes: ["DefaultModel"],
  endpoints: (builder) => ({
    getProviders: builder.query<Provider[], void>({
      query: () => "/providers",
      transformResponse: (response: FetchProvidersResponse) => response.data,
    }),
    getModels: builder.query<Model[], string>({
      query: (providerId) => `/list/${providerId}`,
      transformResponse: (response: FetchModelsResponse) => response.data,
    }),
    updateDefaultModel: builder.mutation<
      UpdateDefaultModelResponse,
      UpdateDefaultModelRequest
    >({
      query: (body) => ({
        url: "/default-model",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DefaultModel"],
    }),
    getDefaultModel: builder.query<DefaultModelResponse["data"], void>({
      query: () => "/default-model",
      transformResponse: (response: DefaultModelResponse) => response.data,
      providesTags: ["DefaultModel"],
    }),
  }),
});

export const {
  useGetProvidersQuery,
  useGetModelsQuery,
  useUpdateDefaultModelMutation,
  useGetDefaultModelQuery,
} = modelApi;

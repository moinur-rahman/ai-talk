import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type ImageModel = 'gpt-image-1' | 'gpt-image-1-mini';
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536';
export type ImageQuality = 'low' | 'medium' | 'high';

export interface GenerateImagePayload {
  prompt: string;
  model: ImageModel;
  size: ImageSize;
  quality: ImageQuality;
}

export interface GenerateImageResult {
  imageDataUrl: string;
}

interface GenerateImageResponse {
  data: GenerateImageResult;
  message: string;
}

export const imageGenerationApi = createApi({
  reducerPath: 'imageGenerationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    generateImage: builder.mutation<GenerateImageResult, GenerateImagePayload>({
      query: (body) => ({ url: '/generate', method: 'POST', body }),
      transformResponse: (response: GenerateImageResponse) => response.data,
    }),
  }),
});

export const { useGenerateImageMutation } = imageGenerationApi;

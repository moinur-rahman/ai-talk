import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axiosInstance from '@/apis/axiosInstance';

interface TranscribeResponse {
  data: { transcript: string };
  message: string;
}

export const audioApi = createApi({
  reducerPath: 'audioApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/audio`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    transcribeAudio: builder.mutation<string, FormData>({
      query: (formData) => ({
        url: '/transcribe',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: TranscribeResponse) =>
        response.data.transcript,
    }),
  }),
});

export const { useTranscribeAudioMutation } = audioApi;

export const speakText = async (text: string): Promise<string> => {
  const response = await axiosInstance.post<Blob>(
    '/audio/speech',
    { text },
    { responseType: 'blob' },
  );
  return URL.createObjectURL(response.data);
};

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCsrfTokenFromCookie } from '@/utils/getCsrfTokenFromCookie';

interface TranscribeResponse {
  data: { transcript: string };
  message: string;
}

interface RealtimeSessionResponse {
  data: { clientSecret: string };
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
    createRealtimeSession: builder.query<string, void>({
      query: () => '/realtime/session',
      transformResponse: (response: RealtimeSessionResponse) =>
        response.data.clientSecret,
    }),
  }),
});

export const { useTranscribeAudioMutation, useLazyCreateRealtimeSessionQuery } =
  audioApi;

export const speakText = async (
  text: string,
  signal?: AbortSignal,
): Promise<HTMLAudioElement> => {
  const csrfToken = getCsrfTokenFromCookie();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/audio/speech`,
    {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ text }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error('TTS request failed');
  }

  const reader = response.body.getReader();
  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  const audio = new Audio(objectUrl);

  return new Promise<HTMLAudioElement>((resolve, reject) => {
    let resolved = false;

    audio.addEventListener('canplay', () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(objectUrl);
        audio.play().then(() => resolve(audio)).catch(reject);
      }
    });

    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

      signal?.addEventListener('abort', () => reader.cancel(), { once: true });

      const waitForUpdate = () =>
        new Promise<void>((r) =>
          sourceBuffer.addEventListener('updateend', () => r(), { once: true }),
        );

      const pump = async () => {
        try {
          while (true) {
            if (signal?.aborted) {
              break;
            }
            const { done, value } = await reader.read();
            if (signal?.aborted) {
              break;
            }
            if (sourceBuffer.updating) {
              await waitForUpdate();
            }
            if (done) {
              mediaSource.endOfStream();
              break;
            }
            sourceBuffer.appendBuffer(value);
          }
        } catch (err) {
          if (!resolved) {
            reject(err);
          }
        }
      };

      pump();
    });
  });
};

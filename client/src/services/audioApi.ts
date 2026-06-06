import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCsrfTokenFromCookie } from '@/utils/getCsrfTokenFromCookie';

interface TranscribeResponse {
  data: { transcript: string };
  message: string;
}

export const audioApi = createApi({
  reducerPath: 'audioApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/audio`,
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

export type RealtimeSessionEventType =
  | 'session-created'
  | 'conversation-created'
  | 'conversation-title'
  | 'error';

export interface RealtimeSessionEvent {
  type: RealtimeSessionEventType;
  sdpAnswer?: string;
  callId?: string;
  conversationId?: string;
  title?: string;
  message?: string;
}

export const startRealtimeSession = async (
  sdp: string,
  conversationId: string | undefined,
  onEvent: (event: RealtimeSessionEvent) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const csrfToken = getCsrfTokenFromCookie();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/audio/realtime/session`,
    {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        sdp,
        ...(conversationId ? { conversationId } : {}),
      }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error('Realtime session request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) {
        continue;
      }
      try {
        const event = JSON.parse(jsonStr) as RealtimeSessionEvent;
        onEvent(event);
      } catch {
        // ignore malformed events
      }
    }
  }
};

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
    `${import.meta.env.VITE_BACKEND_URL}/audio/speech`,
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
        audio
          .play()
          .then(() => resolve(audio))
          .catch(reject);
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

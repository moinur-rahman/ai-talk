'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { startRealtimeSession } from '@/services/audioApi';

export type VoiceAgentStatus = 'idle' | 'connecting' | 'active' | 'error';

export interface VoiceAgentCallbacks {
  onSpeechStarted?: () => void;
  onUserTranscriptCompleted?: (transcript: string) => void;
  onAssistantStarted?: () => void;
  onAssistantTranscriptDelta?: (delta: string) => void;
  onAssistantTranscriptCompleted?: (finalTranscript: string) => void;
}

export interface StartVoiceAgentOptions {
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  onConversationTitle?: (conversationId: string, title: string) => void;
  callbacks?: VoiceAgentCallbacks;
}

interface UseVoiceAgentReturn {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
  error: string | null;
  start: (opts?: StartVoiceAgentOptions) => Promise<void>;
  stop: () => void;
}

const useVoiceAgent = (): UseVoiceAgentReturn => {
  const [status, setStatus] = useState<VoiceAgentStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef<VoiceAgentCallbacks>({});

  const stop = useCallback(() => {
    sseAbortRef.current?.abort();
    sseAbortRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    callbacksRef.current = {};

    setStatus('idle');
    setIsSpeaking(false);
    setIsAssistantSpeaking(false);
    setError(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sseAbortRef.current?.abort();
      pcRef.current?.close();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleDataChannelMessage = useCallback((e: MessageEvent) => {
    const event = JSON.parse(e.data as string) as Record<string, unknown>;

    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        setIsSpeaking(true);
        callbacksRef.current.onSpeechStarted?.();
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsSpeaking(false);
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = (event.transcript as string) ?? '';
        if (transcript.trim()) {
          callbacksRef.current.onUserTranscriptCompleted?.(transcript.trim());
        }
        break;
      }

      case 'response.created':
        setIsAssistantSpeaking(true);
        callbacksRef.current.onAssistantStarted?.();
        break;

      case 'response.output_audio_transcript.delta': {
        const delta = (event.delta as string) ?? '';
        if (delta) {
          callbacksRef.current.onAssistantTranscriptDelta?.(delta);
        }
        break;
      }

      case 'response.output_audio_transcript.done': {
        const finalTranscript = (event.transcript as string) ?? '';
        setIsAssistantSpeaking(false);
        callbacksRef.current.onAssistantTranscriptCompleted?.(finalTranscript);
        break;
      }

      default:
        break;
    }
  }, []);

  const start = useCallback(
    async (opts?: StartVoiceAgentOptions) => {
      if (pcRef.current) {
        return;
      }

      callbacksRef.current = opts?.callbacks ?? {};

      setStatus('connecting');
      setError(null);

      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError('Microphone access denied. Please allow microphone access.');
        setStatus('error');
        return;
      }
      micStreamRef.current = micStream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      const dc = pc.createDataChannel('oai-events');
      dc.addEventListener('message', handleDataChannelMessage);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sseAbort = new AbortController();
      sseAbortRef.current = sseAbort;

      let sdpAnswer: string;
      try {
        sdpAnswer = await new Promise<string>((resolve, reject) => {
          startRealtimeSession(
            offer.sdp!,
            opts?.conversationId,
            (event) => {
              if (event.type === 'session-created' && event.sdpAnswer) {
                resolve(event.sdpAnswer);
              } else if (
                event.type === 'conversation-created' &&
                event.conversationId
              ) {
                opts?.onConversationCreated?.(event.conversationId);
              } else if (
                event.type === 'conversation-title' &&
                event.conversationId &&
                event.title
              ) {
                opts?.onConversationTitle?.(event.conversationId, event.title);
              } else if (event.type === 'error') {
                reject(new Error(event.message ?? 'Session error'));
              }
            },
            sseAbort.signal,
          ).catch((err: unknown) => {
            if (err instanceof Error && err.name !== 'AbortError') {
              reject(err);
            }
          });
        });
      } catch {
        setError('Failed to connect to voice service. Please try again.');
        setStatus('error');
        pc.close();
        pcRef.current = null;
        micStream.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        sseAbortRef.current = null;
        return;
      }

      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });

      setStatus('active');
    },
    [handleDataChannelMessage],
  );

  return {
    status,
    isSpeaking,
    isAssistantSpeaking,
    error,
    start,
    stop,
  };
};

export default useVoiceAgent;

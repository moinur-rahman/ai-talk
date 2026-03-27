'use client';
import { useCallback, useRef, useState } from 'react';
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';
import { useLazyCreateRealtimeSessionQuery } from '@/services/audioApi';

export type VoiceAgentStatus = 'idle' | 'connecting' | 'active' | 'error';

export interface VoiceTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface UseVoiceAgentReturn {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
  liveUserText: string;
  liveAssistantText: string;
  turns: VoiceTurn[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const REALTIME_MODEL = 'gpt-4o-mini-realtime-preview';

const useVoiceAgent = (): UseVoiceAgentReturn => {
  const [status, setStatus] = useState<VoiceAgentStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAssistantText, setLiveAssistantText] = useState('');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const liveUserTextRef = useRef('');
  const liveAssistantTextRef = useRef('');

  const [fetchSession] = useLazyCreateRealtimeSessionQuery();

  const stop = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    liveUserTextRef.current = '';
    liveAssistantTextRef.current = '';

    setStatus('idle');
    setIsSpeaking(false);
    setIsAssistantSpeaking(false);
    setLiveUserText('');
    setLiveAssistantText('');
    setTurns([]);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    let clientSecret: string;
    try {
      clientSecret = await fetchSession().unwrap();
    } catch {
      setError('Failed to create voice session. Please try again.');
      setStatus('error');
      return;
    }

    const agent = new RealtimeAgent({
      name: 'Assistant',
      instructions: 'You are a helpful voice assistant.',
    });

    const transport = new OpenAIRealtimeWebRTC();
    const session = new RealtimeSession(agent, { transport });
    sessionRef.current = session;

    session.on('transport_event', (event) => {
      const e = event as Record<string, unknown>;
      switch (e.type) {
        case 'input_audio_buffer.speech_started':
          setIsSpeaking(true);
          setLiveUserText('');
          liveUserTextRef.current = '';
          break;

        case 'input_audio_buffer.speech_stopped':
          setIsSpeaking(false);
          break;

        case 'conversation.item.input_audio_transcription.delta': {
          const delta = (e.delta as string) ?? '';
          liveUserTextRef.current += delta;
          setLiveUserText(liveUserTextRef.current);
          break;
        }

        case 'conversation.item.input_audio_transcription.completed': {
          const transcript =
            (e.transcript as string) ?? liveUserTextRef.current;
          if (transcript.trim()) {
            setTurns((prev) => [...prev, { role: 'user', text: transcript }]);
          }
          setLiveUserText('');
          liveUserTextRef.current = '';
          break;
        }

        case 'response.created':
          setIsAssistantSpeaking(true);
          setLiveAssistantText('');
          liveAssistantTextRef.current = '';
          break;

        case 'response.output_audio_transcript.delta': {
          const delta = (e.delta as string) ?? '';
          liveAssistantTextRef.current += delta;
          setLiveAssistantText(liveAssistantTextRef.current);
          break;
        }

        case 'response.output_audio_transcript.done': {
          const transcript =
            (e.transcript as string) ?? liveAssistantTextRef.current;
          if (transcript.trim()) {
            setTurns((prev) => [
              ...prev,
              { role: 'assistant', text: transcript },
            ]);
          }
          setLiveAssistantText('');
          liveAssistantTextRef.current = '';
          setIsAssistantSpeaking(false);
          break;
        }

        default:
          break;
      }
    });

    session.on('error', (err) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'error' in err
            ? String((err as { error: unknown }).error)
            : 'Voice agent error';
      setError(msg);
      setStatus('error');
    });

    try {
      await session.connect({
        apiKey: clientSecret,
        model: REALTIME_MODEL,
      });
      setStatus('active');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setStatus('error');
    }
  }, [fetchSession]);

  return {
    status,
    isSpeaking,
    isAssistantSpeaking,
    liveUserText,
    liveAssistantText,
    turns,
    error,
    start,
    stop,
  };
};

export default useVoiceAgent;

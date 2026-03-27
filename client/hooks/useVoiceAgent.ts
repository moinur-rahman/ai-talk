'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCreateRealtimeCallMutation } from '@/services/audioApi';

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

const useVoiceAgent = (): UseVoiceAgentReturn => {
  const [status, setStatus] = useState<VoiceAgentStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAssistantText, setLiveAssistantText] = useState('');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const liveUserTextRef = useRef('');
  const liveAssistantTextRef = useRef('');

  const [createRealtimeCall] = useCreateRealtimeCallMutation();

  const stop = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleDataChannelMessage = useCallback(
    (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as Record<string, unknown>;

      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          setIsSpeaking(true);
          setLiveUserText('');
          liveUserTextRef.current = '';
          break;

        case 'input_audio_buffer.speech_stopped':
          setIsSpeaking(false);
          break;

        case 'conversation.item.input_audio_transcription.delta': {
          const delta = (event.delta as string) ?? '';
          liveUserTextRef.current += delta;
          setLiveUserText(liveUserTextRef.current);
          break;
        }

        case 'conversation.item.input_audio_transcription.completed': {
          const transcript =
            (event.transcript as string) ?? liveUserTextRef.current;
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
          const delta = (event.delta as string) ?? '';
          liveAssistantTextRef.current += delta;
          setLiveAssistantText(liveAssistantTextRef.current);
          break;
        }

        case 'response.output_audio_transcript.done': {
          const transcript =
            (event.transcript as string) ?? liveAssistantTextRef.current;
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
    },
    [],
  );

  const start = useCallback(async () => {
    if (pcRef.current) {
      return; // already active or connecting
    }

    setStatus('connecting');
    setError(null);
    setTurns([]);

    // Request microphone access
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Please allow microphone access.');
      setStatus('error');
      return;
    }
    micStreamRef.current = micStream;

    // Create peer connection
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // Play remote audio from the model
    const audioEl = new Audio();
    audioEl.autoplay = true;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    // Add local microphone track
    micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

    // Set up data channel for events
    const dc = pc.createDataChannel('oai-events');
    dc.addEventListener('message', handleDataChannelMessage);

    // Create SDP offer and send to server
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    let sdpAnswer: string;
    try {
      const result = await createRealtimeCall(offer.sdp!).unwrap();
      sdpAnswer = result.sdpAnswer;
      // result.callId is available here for future sideband use
    } catch {
      setError('Failed to connect to voice service. Please try again.');
      setStatus('error');
      pc.close();
      pcRef.current = null;
      micStream.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      return;
    }

    // Complete WebRTC handshake
    await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });

    setStatus('active');
  }, [createRealtimeCall, handleDataChannelMessage]);

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

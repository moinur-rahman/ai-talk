import { useCallback, useRef, useState } from 'react';
import { useTranscribeAudioMutation } from '@/services/audioApi';

const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
};

const useVoiceInput = (onTranscript: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [transcribeAudio] = useTranscribeAudioMutation();

  const startRecording = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return;
    }

    mediaStreamRef.current = stream;
    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsListening(true);
  }, []);

  const confirmRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.onstop = async () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });
      const extension = (recorder.mimeType || 'audio/webm').includes('ogg')
        ? 'ogg'
        : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `recording.${extension}`);

      setIsTranscribing(true);
      try {
        const transcript = await transcribeAudio(formData).unwrap();
        if (transcript) {
          onTranscript(transcript);
        }
      } catch {
        // transcription failed silently
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.stop();
    setIsListening(false);
  }, [onTranscript, transcribeAudio]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.ondataavailable = null;
    recorder.onstop = () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    };
    recorder.stop();
    setIsListening(false);
  }, []);

  const stopIfListening = useCallback(() => {
    if (isListening) {
      cancelRecording();
    }
  }, [isListening, cancelRecording]);

  return {
    isListening,
    isTranscribing,
    mediaStreamRef,
    startRecording,
    confirmRecording,
    cancelRecording,
    stopIfListening,
  };
};

export default useVoiceInput;

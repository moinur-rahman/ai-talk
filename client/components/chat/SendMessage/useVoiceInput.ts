import { useCallback, useRef, useState } from 'react';

const useVoiceInput = (onTranscript: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      onTranscript(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onTranscript]);

  const stopIfListening = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
  }, [isListening]);

  return { isListening, toggleListening, stopIfListening };
};

export default useVoiceInput;

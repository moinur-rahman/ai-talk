'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { FiPaperclip, FiSend, FiMic, FiMicOff, FiFileText } from 'react-icons/fi';
import { useChat } from '@/contexts/ChatContext';
import { FaStop } from 'react-icons/fa';
import { useUploadFileMutation } from '@/services/fileApi';
import { FileMetadata } from '@/types/chat';
import Image from 'next/image';
import ImageModal from '@/components/common/ImageModal';
import ProviderDropdown from './ProviderDropdown';
import ModelDropdown from './ModelDropdown';
import ReasoningToggle from './ReasoningToggle';

const SendMessage = ({ defaultRows = 1 }: { defaultRows?: number }) => {
  const router = useRouter();

  const {
    streaming,
    error,
    setError,
    sendMessage,
    stopStream,
    conversationId,
  } = useChat();

  const [prompt, setPrompt] = useState('');
  const [filePreviews, setFilePreviews] = useState<
    { id: string; preview: string; type: string; name: string }[]
  >([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    FileMetadata[]
  >([]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [uploadFile] = useUploadFileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const maxHeight = 150;
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    };

    textarea.addEventListener('input', adjustHeight);
    return () => textarea.removeEventListener('input', adjustHeight);
  }, []);

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
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleGenerateText = async (e: FormEvent) => {
    e.preventDefault();

    if ((conversationId && streaming[conversationId]) || !prompt.trim()) {
      return;
    }

    try {
      const newConversationId = await sendMessage({
        prompt: prompt,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      setPrompt('');
      setUploadedAttachments([]);
      setFilePreviews([]);

      if (newConversationId && !conversationId) {
        router.push(`/chat/${newConversationId}`);
      }
    } catch (error) {
      console.error('Error generating text:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateText(e as unknown as FormEvent);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await processFiles(imageFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    setError({});
    const newPreviews: {
      id: string;
      preview: string;
      type: string;
      name: string;
    }[] = [];
    const newAttachments: FileMetadata[] = [];

    for (const file of files) {
      const id = Math.random().toString(36).substr(2, 9);

      if (file.type.startsWith('image/')) {
        try {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newPreviews.push({ id, preview, type: 'image', name: file.name });
        } catch (error) {
          console.error('Error creating preview:', error);
        }
      } else {
        newPreviews.push({
          id,
          preview: '',
          type: 'document',
          name: file.name,
        });
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadFile(formData).unwrap();
        newAttachments.push(result.data);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError((prev) => ({
          ...prev,
          global: 'Failed to upload one or more files. Please try again.',
        }));
      }
    }

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setUploadedAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      return;
    }

    await processFiles(Array.from(files));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const newPreviews = prev.filter((p) => p.id !== id);
      if (newPreviews.length === 0) {
        setUploadedAttachments([]);
      }
      return newPreviews;
    });
  };

  return (
    <div className="w-full max-w-[52rem]">
      {(error?.global || (conversationId && error?.[conversationId])) && (
        <div className="text-red-400 text-xs mb-2 px-1">
          {error?.global || (conversationId && error?.[conversationId])}
        </div>
      )}
      <FilePreviews filePreviews={filePreviews} onRemove={removeFile} />
      <form
        onSubmit={handleGenerateText}
        className="flex flex-col bg-surface-elevated border border-border rounded-2xl focus-within:border-accent/40 transition-all duration-200 px-2 pt-2 pb-1"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        <textarea
          ref={textAreaRef}
          className="w-full px-2 py-1.5 bg-transparent text-primary placeholder-muted resize-none outline-none overflow-y-auto text-sm leading-relaxed"
          placeholder="Message..."
          value={prompt}
          onChange={(e) => {
            if (isListening) recognitionRef.current?.stop();
            setPrompt(e.target.value);
          }}
          onKeyDown={(e) => {
            if (isListening) recognitionRef.current?.stop();
            handleKeyDown(e);
          }}
          onPaste={handlePaste}
          rows={defaultRows}
          style={{ maxHeight: '150px' }}
        />

        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border/50">
          <button
            type="button"
            className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all duration-150 flex-shrink-0"
            onClick={handleFileClick}
            aria-label="Attach File"
          >
            <FiPaperclip size={17} />
          </button>

          <div className="flex-1" />

          <div className="w-[9rem] flex-shrink-0">
            <ProviderDropdown />
          </div>
          <div className="w-px h-4 bg-border flex-shrink-0" />
          <div className="w-[11rem] flex-shrink-0">
            <ModelDropdown />
          </div>

          <ReasoningToggle />

          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            className={`p-2 rounded-lg transition-all duration-150 flex-shrink-0 ${
              isListening
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10 animate-pulse'
                : 'text-muted hover:text-accent hover:bg-accent/10'
            }`}
          >
            {isListening ? <FiMicOff size={17} /> : <FiMic size={17} />}
          </button>

          {conversationId && streaming[conversationId] ? (
            <button
              type="button"
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-150 flex-shrink-0"
              onClick={stopStream}
              aria-label="Stop"
            >
              <FaStop size={15} />
            </button>
          ) : (
            <button
              type="submit"
              className="p-2 text-accent hover:text-accent-hover hover:bg-accent/10 rounded-lg transition-all duration-150 flex-shrink-0 disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed"
              disabled={!prompt.trim() && uploadedAttachments.length === 0}
              aria-label="Send Message"
            >
              <FiSend size={17} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

interface FilePreviewsProps {
  filePreviews: { id: string; preview: string; type: string; name: string }[];
  onRemove: (id: string) => void;
}

const FilePreviews = ({ filePreviews, onRemove }: FilePreviewsProps) => {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const openModal = (src: string, alt: string) => {
    setModalImage({ src, alt });
  };

  const closeModal = () => {
    setModalImage(null);
  };

  if (filePreviews.length === 0) return null;

  return (
    <>
      <div className="mb-2 p-3 bg-surface-elevated rounded-xl border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-body tracking-wide">
            Attachments ({filePreviews.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-0.5">
          {filePreviews.map(({ id, preview, type, name }) => (
            <div key={id} className="relative w-full pb-[100%] group">
              <div className="absolute inset-0 bg-surface-overlay rounded-lg overflow-hidden border border-border transition-all duration-200 hover:border-border-strong">
                {type === 'image' ? (
                  <div className="relative w-full h-full">
                    <button
                      onClick={() => openModal(preview, name)}
                      className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    >
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-dim/90 to-transparent p-2 pt-6 pointer-events-none">
                      <p className="text-xs text-body truncate w-full">
                        {name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <div className="bg-border p-3 rounded-lg mb-2">
                      <FiFileText size={28} className="text-accent" />
                    </div>
                    <p className="text-xs text-body truncate w-full font-medium">
                      {name}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => onRemove(id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-surface-elevated/90 rounded-full text-body hover:text-red-400 text-sm transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Remove file preview"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={closeModal}
          imageSrc={modalImage.src}
          imageAlt={modalImage.alt}
        />
      )}
    </>
  );
};

export default SendMessage;

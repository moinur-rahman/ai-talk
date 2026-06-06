import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileMetadata } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import ImageModal from '@/components/common/ImageModal';
import {
  FiFileText,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiDownload,
  FiEdit2,
  FiGlobe,
  FiLoader,
  FiMic,
  FiRefreshCw,
  FiSquare,
  FiVolume2,
} from 'react-icons/fi';
import { speakText } from '@/services/audioApi';

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/>\s/g, '')
    .trim();

const useTTS = () => {
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoadingTTS(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const audio = await speakText(stripMarkdown(text), controller.signal);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        abortControllerRef.current = null;
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
    } finally {
      setIsLoadingTTS(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { isLoadingTTS, isPlaying, speak, stop };
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const MessageNavigation = ({
  messageId,
  siblingIds,
  onNavigate,
}: {
  messageId?: string;
  siblingIds?: string[];
  onNavigate: (messageId: string) => void;
}) => {
  if (!messageId || !siblingIds || siblingIds.length <= 1) {
    return null;
  }

  const currentIndex = siblingIds.indexOf(messageId);
  if (currentIndex === -1) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 text-xs text-muted">
      <button
        onClick={() => onNavigate(siblingIds[currentIndex - 1])}
        disabled={currentIndex === 0}
        className="p-1 rounded hover:bg-surface-elevated hover:text-body transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous version"
      >
        <FiChevronLeft size={12} />
      </button>
      <span className="tabular-nums px-0.5">
        {currentIndex + 1} / {siblingIds.length}
      </span>
      <button
        onClick={() => onNavigate(siblingIds[currentIndex + 1])}
        disabled={currentIndex === siblingIds.length - 1}
        className="p-1 rounded hover:bg-surface-elevated hover:text-body transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next version"
      >
        <FiChevronRight size={12} />
      </button>
    </div>
  );
};

interface MessageProps {
  mainContent?: string;
  reasoningContent?: string;
  attachments?: FileMetadata[];
  isProcessing?: boolean;
  inputType?: 'text' | 'voice';
  audioDurationMs?: number | null;
  messageId?: string;
  siblingIds?: string[];
  onNavigate?: (messageId: string) => void;
  onEdit?: (editedText: string) => void;
  onRegenerate?: () => void;
}

const MessageImages = ({ attachments }: { attachments: FileMetadata[] }) => {
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

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {attachments.map((file) => (
          <div key={`img-${file.id}`} className="relative">
            <button
              onClick={() => openModal(file.presignedUrl ?? '', file.fileName)}
              className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
            >
              <img
                src={file.presignedUrl ?? ''}
                alt={file.fileName}
                className="rounded-xl max-w-full max-h-60 object-contain"
              />
            </button>
          </div>
        ))}
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

const MessageDocuments = ({ attachments }: { attachments: FileMetadata[] }) => (
  <div className="mt-3 grid grid-cols-1 gap-2">
    {attachments.map((file) => (
      <div key={`doc-${file.id}`} className="relative">
        <a
          href={file.presignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-3 bg-surface-elevated border border-border rounded-xl text-primary hover:bg-surface-overlay hover:border-border-strong transition-all duration-200"
        >
          <div className="bg-border p-2 rounded-lg mr-3 shrink-0">
            <FiFileText size={22} className="text-accent" />
          </div>
          <div className="overflow-hidden flex-grow">
            <p className="truncate font-medium text-sm">{file.fileName}</p>
            <div className="flex items-center mt-1 text-xs text-body">
              <span className="bg-border px-2 py-0.5 rounded-full">
                {(parseInt(file.fileSize) / 1024).toFixed(1)} KB
              </span>
              <span className="ml-2 opacity-70">
                {file.mimeType.split('/')[1].toUpperCase()}
              </span>
            </div>
          </div>
        </a>
      </div>
    ))}
  </div>
);

const ReasoningSection = ({
  content,
  isProcessing = false,
}: {
  content: string;
  isProcessing?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`mb-4 border border-amber-500/20 bg-amber-900/10 rounded-lg overflow-hidden ${
        isProcessing && !isExpanded ? 'animate-pulse' : ''
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-900/10 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 bg-amber-500/15 rounded-full ${
              isProcessing ? 'animate-spin' : ''
            }`}
          >
            <FiCpu size={14} className="text-amber-400" />
          </div>
          <span className="text-amber-300/90 font-medium text-xs tracking-wide uppercase">
            Reasoning
            {isProcessing && !isExpanded && (
              <span className="ml-2 text-amber-400 animate-pulse normal-case tracking-normal">
                <span className="inline-block animate-bounce delay-0">.</span>
                <span className="inline-block animate-bounce delay-100">.</span>
                <span className="inline-block animate-bounce delay-200">.</span>
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && !isExpanded && (
            <span className="text-xs text-amber-400/70 animate-pulse">
              Processing
            </span>
          )}
          <span className="text-xs text-amber-500/50 hidden sm:inline">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
          {isExpanded ? (
            <FiChevronUp className="text-amber-500/50" size={14} />
          ) : (
            <FiChevronDown className="text-amber-500/50" size={14} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="border-t border-amber-500/10 pt-3">
            <div className="bg-surface/60 rounded-md p-3 text-amber-100/80 text-sm leading-relaxed">
              {isProcessing && content.trim() === '' ? (
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="animate-spin">
                    <FiCpu size={14} />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserMessage = ({
  mainContent,
  attachments,
  inputType,
  audioDurationMs,
  messageId,
  siblingIds,
  onNavigate,
  onEdit,
}: MessageProps) => {
  const imageFiles = attachments?.filter(
    (file) => file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const documentFiles = attachments?.filter(
    (file) => !file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const [copyStatus, setCopyStatus] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    if (!mainContent) return;
    navigator.clipboard.writeText(mainContent).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('');
      }, 2000);
    });
  };

  const handleEditStart = () => {
    setEditValue(mainContent ?? '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleEditSend = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      return;
    }
    onEdit?.(trimmed);
    setIsEditing(false);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEditSend();
    }
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const isVoice = inputType === 'voice';

  if (isEditing) {
    return (
      <div className="flex flex-col items-end w-full">
        <div className="w-full max-w-[80%] flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleTextareaInput}
            onKeyDown={handleEditKeyDown}
            className="w-full bg-[#1e2f44] border border-accent/50 text-[#C8D8E4] text-sm px-4 py-3 rounded-2xl rounded-tr-sm resize-none outline-none focus:border-accent overflow-hidden leading-relaxed"
            rows={1}
          />
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted">Ctrl+Enter to send</span>
            <button
              onClick={handleEditCancel}
              className="px-3 py-1.5 text-xs text-muted hover:text-body border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSend}
              disabled={!editValue.trim()}
              className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end w-full group">
      {imageFiles && imageFiles.length > 0 && (
        <MessageImages attachments={imageFiles} />
      )}
      {documentFiles && documentFiles.length > 0 && (
        <MessageDocuments attachments={documentFiles} />
      )}
      {isVoice ? (
        <div className="flex flex-col items-end gap-1 mt-1 max-w-[80%]">
          <div className="flex items-center gap-2.5 bg-[#1e2f44] border border-[#2a4560] px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
            <FiMic size={14} className="text-accent shrink-0" />
            <p className="text-[#C8D8E4] text-sm italic">{mainContent}</p>
          </div>
          {audioDurationMs != null && (
            <div className="flex items-center gap-1 text-muted">
              <FiMic size={11} />
              <span className="text-xs tabular-nums">
                {formatDuration(audioDurationMs)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1e2f44] border border-[#2a4560] text-primary px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm mt-1">
          <div className="text-sm leading-relaxed break-words">
            {mainContent?.split('\n').map((line, lineIndex) => (
              <p
                key={`line-${line.slice(0, 10)}-${lineIndex}`}
                className="text-[#C8D8E4] break-all"
              >
                {line}
              </p>
            )) || <p className="text-secondary italic text-sm">No content</p>}
          </div>
        </div>
      )}
      <div className="flex items-center justify-end mt-1 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onNavigate && (
          <MessageNavigation
            messageId={messageId}
            siblingIds={siblingIds}
            onNavigate={onNavigate}
          />
        )}
        {onEdit && (
          <button
            onClick={handleEditStart}
            className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated"
            aria-label="Edit message"
            title="Edit message"
          >
            <FiEdit2 size={12} />
            <span className="text-xs">Edit</span>
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated"
          aria-label="Copy message"
          title={copyStatus || 'Copy message'}
        >
          {copyStatus ? (
            <span className="text-xs text-accent">✓ Copied</span>
          ) : (
            <>
              <FiCopy size={12} />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface AssistantMessageProps extends MessageProps {
  generatedImage?: string;
  isGeneratingImage?: boolean;
  isSearching?: boolean;
  isStreaming?: boolean;
}

export const AssistantMessage = ({
  mainContent,
  reasoningContent,
  attachments,
  generatedImage,
  isProcessing = false,
  isGeneratingImage = false,
  isSearching = false,
  isStreaming = false,
  messageId,
  siblingIds,
  onNavigate,
  onRegenerate,
}: AssistantMessageProps) => {
  const effectiveGeneratedImage =
    generatedImage ??
    attachments?.find((a) => a.mimeType?.startsWith('image/') && a.presignedUrl)
      ?.presignedUrl;

  const imageFiles = attachments?.filter(
    (file) =>
      file.mimeType.startsWith('image/') &&
      file.presignedUrl &&
      file.presignedUrl !== effectiveGeneratedImage,
  );

  const documentFiles = attachments?.filter(
    (file) => !file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const [copyStatus, setCopyStatus] = useState<string>('');
  const [imageCopyStatus, setImageCopyStatus] = useState<string>('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const { isLoadingTTS, isPlaying, speak, stop } = useTTS();

  const handleCopy = () => {
    if (!mainContent) return;
    navigator.clipboard.writeText(mainContent).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  const handleCopyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setImageCopyStatus('Copied!');
      setTimeout(() => setImageCopyStatus(''), 2000);
    } catch {
      setImageCopyStatus('Failed');
      setTimeout(() => setImageCopyStatus(''), 2000);
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-start w-full group">
      {imageFiles && imageFiles.length > 0 && (
        <MessageImages attachments={imageFiles} />
      )}
      {documentFiles && documentFiles.length > 0 && (
        <MessageDocuments attachments={documentFiles} />
      )}
      <div className="flex items-start gap-3 w-full">
        {/* Diamond indicator */}
        <div className="shrink-0 mt-1 w-6 h-6 rounded-md bg-surface-elevated border border-border flex items-center justify-center">
          <div className="w-2 h-2 rotate-45 rounded-sm bg-accent" />
        </div>
        <div className="flex-1 text-primary break-words overflow-hidden min-w-0">
          {reasoningContent && (
            <ReasoningSection
              content={reasoningContent}
              isProcessing={isProcessing}
            />
          )}
          {isSearching && (
            <div className="flex items-center gap-2 text-blue-400 text-sm py-1">
              <FiGlobe size={14} className="animate-spin" />
              <span className="animate-pulse">Searching the web...</span>
            </div>
          )}
          {isGeneratingImage && (
            <div className="flex items-center gap-2 text-muted text-sm py-1">
              <div className="w-4 h-4 rounded border border-accent/40 bg-accent/10 animate-pulse" />
              <span className="animate-pulse">Generating image...</span>
            </div>
          )}
          {effectiveGeneratedImage && (
            <div className="mb-3">
              <button
                onClick={() => setModalImage(effectiveGeneratedImage)}
                className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
              >
                <img
                  src={effectiveGeneratedImage}
                  alt="Generated image"
                  className="rounded-xl w-80 h-80 object-contain bg-surface-elevated"
                />
              </button>
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={() => handleCopyImage(effectiveGeneratedImage)}
                  className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated text-xs"
                  title="Copy image"
                >
                  {imageCopyStatus ? (
                    <span className="text-accent">✓ {imageCopyStatus}</span>
                  ) : (
                    <>
                      <FiCopy size={12} />
                      <span>Copy image</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadImage(effectiveGeneratedImage)}
                  className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated text-xs"
                  title="Download image"
                >
                  <FiDownload size={12} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
          {modalImage && (
            <ImageModal
              isOpen={!!modalImage}
              onClose={() => setModalImage(null)}
              imageSrc={modalImage}
              imageAlt="Generated image"
            />
          )}
          {isStreaming &&
            !isGeneratingImage &&
            !effectiveGeneratedImage &&
            !mainContent && (
              <div className="flex items-center gap-2 text-muted text-sm py-1">
                <div className="w-4 h-4 rounded-full bg-muted/30 animate-pulse" />
                <div className="w-24 h-3 rounded bg-muted/20 animate-pulse" />
              </div>
            )}
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={mainContent || ''} />
          </div>
        </div>
      </div>
      {mainContent && (
        <div className="flex items-center mt-1 ml-9 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onNavigate && (
            <MessageNavigation
              messageId={messageId}
              siblingIds={siblingIds}
              onNavigate={onNavigate}
            />
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated"
              aria-label="Regenerate response"
              title="Regenerate response"
            >
              <FiRefreshCw size={12} />
              <span className="text-xs">Regenerate</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated"
            aria-label="Copy message"
            title={copyStatus || 'Copy message'}
          >
            {copyStatus ? (
              <span className="text-xs text-accent">✓ Copied</span>
            ) : (
              <>
                <FiCopy size={12} />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => (isPlaying ? stop() : speak(mainContent))}
            disabled={isLoadingTTS}
            className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-body transition-colors duration-150 rounded-md hover:bg-surface-elevated disabled:cursor-not-allowed"
            aria-label={isPlaying ? 'Stop speaking' : 'Speak message'}
            title={isPlaying ? 'Stop' : 'Speak'}
          >
            {isLoadingTTS ? (
              <FiLoader size={12} className="animate-spin" />
            ) : isPlaying ? (
              <>
                <FiSquare size={12} className="text-accent" />
                <span className="text-xs text-accent">Stop</span>
              </>
            ) : (
              <>
                <FiVolume2 size={12} />
                <span className="text-xs">Speak</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

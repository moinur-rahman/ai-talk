'use client';
import { useState } from 'react';
import { FileMetadata } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import Image from 'next/image';
import ImageModal from '@/components/common/ImageModal';
import {
  FiFileText,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
} from 'react-icons/fi';

interface MessageProps {
  mainContent?: string;
  reasoningContent?: string;
  attachments?: FileMetadata[];
  isProcessing?: boolean;
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
              <Image
                src={file.presignedUrl ?? ''}
                alt={file.fileName}
                width={300}
                height={200}
                className="rounded-xl max-w-full max-h-60 object-contain"
                unoptimized
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
          <div className="bg-border p-2 rounded-lg mr-3 flex-shrink-0">
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

export const UserMessage = ({ mainContent, attachments }: MessageProps) => {
  const imageFiles = attachments?.filter(
    (file) => file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const documentFiles = attachments?.filter(
    (file) => !file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = () => {
    if (!mainContent) return;
    navigator.clipboard.writeText(mainContent).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('');
      }, 2000);
    });
  };

  return (
    <div className="flex flex-col items-end w-full group">
      {imageFiles && imageFiles.length > 0 && (
        <MessageImages attachments={imageFiles} />
      )}
      {documentFiles && documentFiles.length > 0 && (
        <MessageDocuments attachments={documentFiles} />
      )}
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
      <div className="flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

export const AssistantMessage = ({
  mainContent,
  reasoningContent,
  attachments,
  isProcessing = false,
}: MessageProps) => {
  const imageFiles = attachments?.filter(
    (file) => file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const documentFiles = attachments?.filter(
    (file) => !file.mimeType.startsWith('image/') && file.presignedUrl,
  );

  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = () => {
    if (!mainContent) return;
    navigator.clipboard.writeText(mainContent).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    });
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
        <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-md bg-surface-elevated border border-border flex items-center justify-center">
          <div className="w-2 h-2 rotate-45 rounded-sm bg-accent" />
        </div>
        <div className="flex-1 text-primary break-words overflow-hidden min-w-0">
          {reasoningContent && (
            <ReasoningSection
              content={reasoningContent}
              isProcessing={isProcessing}
            />
          )}
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={mainContent || ''} />
          </div>
        </div>
      </div>
      <div className="flex items-center mt-1 ml-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

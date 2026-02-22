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
  <div className="mt-3 grid grid-cols-1 gap-3">
    {attachments.map((file) => (
      <div key={`doc-${file.id}`} className="relative">
        <a
          href={file.presignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl text-gray-200 hover:from-gray-700 hover:to-gray-600 transition-all duration-200 shadow-md border border-gray-600 hover:border-gray-500"
        >
          <div className="bg-gray-600 p-2 rounded-lg mr-3 flex-shrink-0">
            <FiFileText size={24} className="text-blue-300" />
          </div>
          <div className="overflow-hidden flex-grow">
            <p className="truncate font-medium">{file.fileName}</p>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <span className="bg-gray-600 px-2 py-0.5 rounded-full">
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
      className={`mb-4 border border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg overflow-hidden ${
        isProcessing && !isExpanded ? 'animate-pulse' : ''
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-900/10 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 bg-amber-500/20 rounded-full ${
              isProcessing ? 'animate-spin' : ''
            }`}
          >
            <FiCpu size={16} className="text-amber-400" />
          </div>
          <span className="text-amber-300 font-medium text-sm">
            AI Reasoning Process
            {isProcessing && !isExpanded && (
              <span className="ml-2 text-amber-400 animate-pulse">
                <span className="inline-block animate-bounce delay-0">.</span>
                <span className="inline-block animate-bounce delay-100">.</span>
                <span className="inline-block animate-bounce delay-200">.</span>
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && !isExpanded && (
            <span className="text-xs text-amber-400 animate-pulse">
              Processing
            </span>
          )}
          <span className="text-xs text-amber-400/70 hidden sm:inline">
            {isExpanded ? 'Hide' : 'Show'} reasoning
          </span>
          {isExpanded ? (
            <FiChevronUp className="text-amber-400" size={16} />
          ) : (
            <FiChevronDown className="text-amber-400" size={16} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="border-t border-amber-500/20 pt-3">
            <div className="bg-gray-900/50 rounded-md p-3 text-amber-100/90 text-sm leading-relaxed">
              {isProcessing && content.trim() === '' ? (
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="animate-spin">
                    <FiCpu size={16} />
                  </div>
                  <span>Thinking...</span>
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
    <div className="flex flex-col items-end w-full">
      {imageFiles && imageFiles.length > 0 && (
        <MessageImages attachments={imageFiles} />
      )}
      {documentFiles && documentFiles.length > 0 && (
        <MessageDocuments attachments={documentFiles} />
      )}
      <div className="bg-gray-700 text-white p-3 rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl max-w-[80%] shadow-lg whitespace-pre-wrap mt-1 break-words overflow-hidden relative group">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-800/80 rounded-full text-gray-400 hover:text-blue-400 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
          aria-label="Copy message"
          title={copyStatus || 'Copy message'}
        >
          {copyStatus ? (
            <span className="text-xs text-blue-400">✓</span>
          ) : (
            <FiCopy size={14} />
          )}
        </button>
        {mainContent?.split('\n').map((line, lineIndex) => (
          <p
            key={`line-${line.slice(0, 10)}-${lineIndex}`}
            className="text-gray-200 break-all"
          >
            {line}
          </p>
        )) || <p className="text-gray-400 italic">No content</p>}
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

  return (
    <div className="flex flex-col items-start w-full">
      {imageFiles && imageFiles.length > 0 && (
        <MessageImages attachments={imageFiles} />
      )}
      {documentFiles && documentFiles.length > 0 && (
        <MessageDocuments attachments={documentFiles} />
      )}
      <div className="text-white p-3 rounded-lg w-full break-words overflow-hidden">
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
  );
};

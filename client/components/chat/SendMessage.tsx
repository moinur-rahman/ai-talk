'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect, useRef } from 'react';
import { FiPaperclip, FiSend } from 'react-icons/fi';
import { useChat } from '@/contexts/ChatContext';
import { FaStop } from 'react-icons/fa';
import { useUploadFileMutation } from '@/services/fileApi';
import { FileMetadata } from '@/types/chat';
import Image from 'next/image';
import { FiFileText } from 'react-icons/fi';
import ImageModal from '@/components/common/ImageModal';

const SendMessage = () => {
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
        router.push(`/${newConversationId}`);
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
        className="flex items-end bg-[#0E1520] border border-[#1A2840] rounded-2xl focus-within:border-[#1D3A50] transition-all duration-200 p-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <button
          type="button"
          className="p-2 text-[#3D5570] hover:text-[#00C4A1] hover:bg-[#00C4A1]/10 rounded-lg transition-all duration-150 flex-shrink-0"
          onClick={handleFileClick}
          aria-label="Attach File"
        >
          <FiPaperclip size={18} />
        </button>

        <textarea
          ref={textAreaRef}
          className="flex-grow mx-2 py-2 px-1 bg-transparent text-[#D8E8F3] placeholder-[#3D5570] resize-none outline-none overflow-y-auto text-sm leading-relaxed"
          placeholder="Message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          style={{ maxHeight: '150px' }}
        />

        {conversationId && streaming[conversationId] ? (
          <button
            type="button"
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-150 flex-shrink-0"
            onClick={stopStream}
            aria-label="Stop"
          >
            <FaStop size={16} />
          </button>
        ) : (
          <button
            type="submit"
            className="p-2 text-[#00C4A1] hover:text-[#00E5C0] hover:bg-[#00C4A1]/10 rounded-lg transition-all duration-150 flex-shrink-0 disabled:text-[#3D5570] disabled:hover:bg-transparent disabled:cursor-not-allowed"
            disabled={!prompt.trim() && uploadedAttachments.length === 0}
            aria-label="Send Message"
          >
            <FiSend size={18} />
          </button>
        )}
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
      <div className="mb-2 p-3 bg-[#0E1520] rounded-xl border border-[#1A2840]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-[#7A96AD] tracking-wide">
            Attachments ({filePreviews.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-0.5">
          {filePreviews.map(({ id, preview, type, name }) => (
            <div key={id} className="relative w-full pb-[100%] group">
              <div className="absolute inset-0 bg-[#111E2E] rounded-lg overflow-hidden border border-[#1A2840] transition-all duration-200 hover:border-[#1D3A50]">
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#060810]/90 to-transparent p-2 pt-6 pointer-events-none">
                      <p className="text-xs text-[#7A96AD] truncate w-full">
                        {name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <div className="bg-[#1A2840] p-3 rounded-lg mb-2">
                      <FiFileText size={28} className="text-[#00C4A1]" />
                    </div>
                    <p className="text-xs text-[#7A96AD] truncate w-full font-medium">
                      {name}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => onRemove(id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-[#0E1520]/90 rounded-full text-[#7A96AD] hover:text-red-400 text-sm transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
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

"use client";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import { useChat } from "@/contexts/ChatContext";
import { FaStop } from "react-icons/fa";
import { useUploadFileMutation } from "@/services/fileApi";
import { FileMetadata } from "@/types/chat";
import Image from "next/image";
import { FiFileText } from "react-icons/fi";
import ImageModal from "@/components/common/ImageModal";

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

  const [prompt, setPrompt] = useState("");
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
      textarea.style.height = "auto";
      const maxHeight = 150;
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    };

    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
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

      setPrompt("");
      setUploadedAttachments([]);
      setFilePreviews([]);

      if (newConversationId && !conversationId) {
        router.push(`/${newConversationId}`);
      }
    } catch (error) {
      console.error("Error generating text:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateText(e as unknown as FormEvent);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
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

      if (file.type.startsWith("image/")) {
        try {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newPreviews.push({ id, preview, type: "image", name: file.name });
        } catch (error) {
          console.error("Error creating preview:", error);
        }
      } else {
        newPreviews.push({
          id,
          preview: "",
          type: "document",
          name: file.name,
        });
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadFile(formData).unwrap();
        newAttachments.push(result.data);
      } catch (error) {
        console.error("Error uploading file:", error);
        setError((prev) => ({
          ...prev,
          global: "Failed to upload one or more files. Please try again.",
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
      fileInputRef.current.value = "";
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
    <div className="w-full max-w-[55rem] bg-gray-900">
      {(error?.global || (conversationId && error?.[conversationId])) && (
        <div className="text-red-500 mb-2">
          {error?.global || (conversationId && error?.[conversationId])}
        </div>
      )}
      <FilePreviews filePreviews={filePreviews} onRemove={removeFile} />
      <form
        onSubmit={handleGenerateText}
        className="flex bg-gray-800 p-3 rounded-lg w-full"
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
          className="p-2 text-gray-400 hover:text-gray-300"
          onClick={handleFileClick}
          aria-label="Attach File"
        >
          <FiPaperclip size={24} />
        </button>

        <textarea
          ref={textAreaRef}
          className="flex-grow mx-3 p-2 bg-gray-900 text-white rounded-lg resize-none outline-none overflow-y-auto"
          placeholder="Type your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          style={{ maxHeight: "150px" }}
        />

        {conversationId && streaming[conversationId] ? (
          <button
            type="button"
            className="p-2 text-red-500 hover:text-red-400"
            onClick={stopStream}
            aria-label="Stop"
          >
            <FaStop size={24} />
          </button>
        ) : (
          <button
            type="submit"
            className="p-2 text-blue-500 hover:text-blue-400"
            disabled={!prompt.trim() && uploadedAttachments.length === 0}
            aria-label="Send Message"
          >
            <FiSend size={24} />
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
      <div className="mb-4 mx-3 p-4 bg-gradient-to-b from-gray-700 to-gray-750 rounded-xl border border-gray-600 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">
            Attachments ({filePreviews.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[250px] overflow-y-auto p-1">
          {filePreviews.map(({ id, preview, type, name }) => (
            <div key={id} className="relative w-full pb-[100%] group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-750 to-gray-800 rounded-lg overflow-hidden border border-gray-600 transition-all duration-200 hover:border-gray-500 hover:shadow-md">
                {type === "image" ? (
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-2 pt-6 pointer-events-none">
                      <p className="text-xs text-gray-300 truncate w-full">
                        {name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <div className="bg-gray-700/50 p-3 rounded-lg mb-2">
                      <FiFileText size={32} className="text-blue-300" />
                    </div>
                    <p className="text-xs text-gray-300 truncate w-full font-medium">
                      {name}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => onRemove(id)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-800/90 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700 text-sm transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md z-10"
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

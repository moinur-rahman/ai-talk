import { useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUploadFileMutation } from '@/services/fileApi';
import type { FileMetadata } from '@/types/chat';

const SUPPORTED_APPLICATION_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/csv',
  'application/x-iif',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.apple.pages',
  'application/vnd.google-apps.document',
  'application/vnd.apple.iwork',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.apple.keynote',
  'application/vnd.google-apps.presentation',
  'application/javascript',
  'application/typescript',
  'application/json',
  'application/xml',
  'application/x-sql',
  'application/x-scala',
  'application/x-rust',
  'application/x-powershell',
  'application/x-patch',
  'application/x-php',
  'application/x-httpd-php',
  'application/x-httpd-php-source',
  'application/x-bash',
  'application/x-awk',
  'application/graphql',
  'application/x-graphql',
  'application/x-ndjson',
  'application/json5',
  'application/x-json5',
  'application/toml',
  'application/x-toml',
  'application/x-yaml',
  'application/yaml',
  'application/x-subrip',
  'application/x-protobuf',
  'application/x-terraform',
]);

const isSupportedMimeType = (mimeType: string) =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('text/') ||
  SUPPORTED_APPLICATION_MIME_TYPES.has(mimeType);

interface FilePreview {
  id: string;
  preview: string;
  type: string;
  name: string;
}

const useFileUpload = () => {
  const { setError } = useChat();
  const [uploadFile] = useUploadFileMutation();

  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    FileMetadata[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    setError({});
    const newPreviews: FilePreview[] = [];
    const newAttachments: FileMetadata[] = [];

    for (const file of files) {
      if (!isSupportedMimeType(file.type)) {
        setError((prev) => ({
          ...prev,
          global: `"${file.name}" has an unsupported file type. Please upload an image, PDF, document, spreadsheet, presentation, or text/code file.`,
        }));
        continue;
      }

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
        } catch {
          console.error('Error creating preview');
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
      } catch {
        setError((prev) => ({
          ...prev,
          global: 'Failed to upload one or more files. Please try again.',
        }));
      }
    }

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setUploadedAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setUploadedAttachments([]);
      return next;
    });
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await processFiles(imageFiles);
    }
  };

  const reset = () => {
    setFilePreviews([]);
    setUploadedAttachments([]);
  };

  return {
    filePreviews,
    uploadedAttachments,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handlePaste,
    removeFile,
    reset,
  };
};

export default useFileUpload;

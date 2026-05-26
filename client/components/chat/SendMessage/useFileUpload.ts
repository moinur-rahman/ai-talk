import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUploadFileMutation } from '@/services/fileApi';
import type { FileMetadata, RagStatus } from '@/types/chat';

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

const TERMINAL_STATUSES = new Set<RagStatus>(['completed', 'skipped', 'failed']);
const POLL_INITIAL_DELAY_MS = 1500;
const POLL_MAX_DELAY_MS = 5000;
const POLL_BACKOFF_FACTOR = 1.5;

export interface FilePreview {
  id: string;
  preview: string;
  type: string;
  name: string;
  /** Actual file ID returned by the server after upload. */
  fileId?: string;
  /** RAG indexing status — null for images, set for documents. */
  ragStatus?: RagStatus | null;
}

const useFileUpload = () => {
  const { setError } = useChat();
  const [uploadFile] = useUploadFileMutation();

  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracks which file IDs still need polling.
  const activePollingIdsRef = useRef<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const schedulePoll = useCallback((delayMs: number) => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    pollTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current || activePollingIdsRef.current.size === 0) {
        return;
      }

      const ids = [...activePollingIdsRef.current];
      try {
        const query = ids.map((id) => `ids=${id}`).join('&');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/metadata?${query}`,
          { credentials: 'include' },
        );
        if (!res.ok) throw new Error('Poll failed');

        const data = (await res.json()) as {
          data: { id: string; ragStatus?: RagStatus | null }[];
        };

        const statusMap = new Map(
          data.data.map((f) => [f.id, f.ragStatus ?? null]),
        );

        // Update previews with latest statuses.
        setFilePreviews((prev) =>
          prev.map((p) => {
            if (p.fileId && statusMap.has(p.fileId)) {
              const next = statusMap.get(p.fileId) as RagStatus | null;
              return next !== p.ragStatus ? { ...p, ragStatus: next } : p;
            }
            return p;
          }),
        );

        // Remove terminal IDs from the polling set.
        for (const [id, status] of statusMap) {
          if (status && TERMINAL_STATUSES.has(status)) {
            activePollingIdsRef.current.delete(id);
          }
        }

        // Keep polling if any IDs remain.
        if (mountedRef.current && activePollingIdsRef.current.size > 0) {
          schedulePoll(Math.min(delayMs * POLL_BACKOFF_FACTOR, POLL_MAX_DELAY_MS));
        }
      } catch {
        // Retry at the same delay on transient errors.
        if (mountedRef.current && activePollingIdsRef.current.size > 0) {
          schedulePoll(delayMs);
        }
      }
    }, delayMs);
  }, []);

  const processFiles = async (files: File[]) => {
    setError({});
    const newPreviews: FilePreview[] = [];
    const newAttachments: FileMetadata[] = [];
    const newPollingIds: string[] = [];

    for (const file of files) {
      if (!isSupportedMimeType(file.type)) {
        setError((prev) => ({
          ...prev,
          global: `"${file.name}" has an unsupported file type. Please upload an image, PDF, document, spreadsheet, presentation, or text/code file.`,
        }));
        continue;
      }

      const id = Math.random().toString(36).substr(2, 9);
      const preview: FilePreview = { id, preview: '', type: 'document', name: file.name };

      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          preview.preview = dataUrl;
          preview.type = 'image';
        } catch {
          console.error('Error creating preview');
        }
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadFile(formData).unwrap();
        newAttachments.push(result.data);

        preview.fileId = result.data.id;
        preview.ragStatus = result.data.ragStatus ?? null;

        if (result.data.ragStatus === 'processing') {
          newPollingIds.push(result.data.id);
        }
      } catch {
        setError((prev) => ({
          ...prev,
          global: 'Failed to upload one or more files. Please try again.',
        }));
      }

      newPreviews.push(preview);
    }

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setUploadedAttachments((prev) => [...prev, ...newAttachments]);

    if (newPollingIds.length > 0) {
      for (const fileId of newPollingIds) {
        activePollingIdsRef.current.add(fileId);
      }
      schedulePoll(POLL_INITIAL_DELAY_MS);
    }
  };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed?.fileId) {
        activePollingIdsRef.current.delete(removed.fileId);
      }
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) {
        setUploadedAttachments([]);
      }
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
    activePollingIdsRef.current.clear();
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    setFilePreviews([]);
    setUploadedAttachments([]);
  };

  const isAnyDocumentProcessing = filePreviews.some(
    (p) => p.ragStatus === 'processing',
  );

  return {
    filePreviews,
    uploadedAttachments,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handlePaste,
    removeFile,
    reset,
    isAnyDocumentProcessing,
  };
};

export default useFileUpload;

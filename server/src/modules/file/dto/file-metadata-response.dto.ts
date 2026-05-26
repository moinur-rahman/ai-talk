import type { RagStatus } from './file-upload-response.dto.js';

export class FileMetadataResponseDto {
  id: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: string;
  createdAt?: Date;
  presignedUrl?: string;
  storageUrl?: string;
  ragStatus?: RagStatus | null;
  error?: string;
}

export class FileMetadataResponseDto {
  id: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: string;
  createdAt?: Date;
  presignedUrl?: string;
  storageUrl?: string;
  error?: string;
}

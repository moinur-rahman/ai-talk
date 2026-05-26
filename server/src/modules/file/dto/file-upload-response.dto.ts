export type RagStatus = 'processing' | 'completed' | 'skipped' | 'failed';

export class FileUploadResponseDto {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  presignedUrl: string;
  ragStatus: RagStatus | null;
}

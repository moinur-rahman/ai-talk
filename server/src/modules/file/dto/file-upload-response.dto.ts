export class FileUploadResponseDto {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  presignedUrl: string;
}

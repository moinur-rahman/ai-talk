import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { SeaweedFSService } from '../../providers/seaweedfs/seaweedfs.service.js';
import { FileUploadResponseDto } from './dto/file-upload-response.dto.js';
import { FileMetadataResponseDto } from './dto/file-metadata-response.dto.js';

const PRESIGNED_URL_EXPIRATION = 60 * 5; // 5 minutes
const DEFAULT_BUCKET = 'ai-talk-files';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seaweedfs: SeaweedFSService,
  ) {}

  private async ensureBucketExists(bucketName: string): Promise<void> {
    const exists = await this.seaweedfs.bucketExists(bucketName);
    if (!exists) {
      await this.seaweedfs.createBucket(bucketName);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<FileUploadResponseDto> {
    try {
      const bucketName = DEFAULT_BUCKET;
      await this.ensureBucketExists(bucketName);

      const objectName = `${uuidv4()}-${file.originalname}`;

      await this.seaweedfs.uploadFile(
        bucketName,
        objectName,
        file.buffer,
        file.mimetype,
      );

      const fileRecord = await this.prisma.file.create({
        data: {
          userId,
          bucketName,
          fileName: file.originalname,
          objectName,
          mimeType: file.mimetype,
          fileSize: BigInt(file.size),
        },
      });

      const presignedUrl = await this.seaweedfs.getPresignedUrl(
        bucketName,
        objectName,
        PRESIGNED_URL_EXPIRATION,
      );

      return {
        id: fileRecord.id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        presignedUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async downloadFileById(id: string): Promise<{
    stream: Readable;
    size: number;
    mimeType: string;
    fileName: string;
  }> {
    const fileRecord = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    try {
      const bucketName = fileRecord.bucketName;
      await this.ensureBucketExists(bucketName);

      const metadata = await this.seaweedfs.getFileMetadata(
        bucketName,
        fileRecord.objectName,
      );

      const stream = await this.seaweedfs.getFileStream(
        bucketName,
        fileRecord.objectName,
      );

      return {
        stream,
        size: metadata.size,
        mimeType: metadata.contentType || fileRecord.mimeType,
        fileName: fileRecord.fileName,
      };
    } catch (error) {
      this.logger.error(
        `Failed to download file ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  async getMultipleFilesMetadata(
    ids: string[],
  ): Promise<FileMetadataResponseDto[]> {
    return Promise.all(
      ids.map(async (id) => {
        try {
          const fileRecord = await this.prisma.file.findUnique({
            where: { id },
          });

          if (!fileRecord) {
            return {
              id,
              error: 'File not found',
            };
          }

          let presignedUrl: string | undefined;
          try {
            presignedUrl = await this.seaweedfs.getPresignedUrl(
              fileRecord.bucketName,
              fileRecord.objectName,
              PRESIGNED_URL_EXPIRATION,
            );
          } catch (error) {
            this.logger.error(
              `Failed to generate presigned URL for file ${id}: ${error.message}`,
            );
          }

          return {
            id,
            fileName: fileRecord.fileName,
            mimeType: fileRecord.mimeType,
            fileSize: fileRecord.fileSize.toString(),
            createdAt: fileRecord.createdAt,
            presignedUrl,
          };
        } catch (error) {
          return {
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );
  }
}

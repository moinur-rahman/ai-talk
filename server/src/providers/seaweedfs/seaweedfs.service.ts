import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class SeaweedFSService {
  private readonly logger = new Logger(SeaweedFSService.name);
  private readonly s3Client: S3Client;
  private readonly s3ClientPublic: S3Client;
  private readonly endpoint: string;
  private readonly publicEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const filerHost = this.configService.get<string>('SEAWEEDFS_FILER');
    const publicUrl = this.configService.get<string>('SEAWEEDFS_PUBLIC_URL');

    if (!publicUrl) {
      throw new Error('SEAWEEDFS_PUBLIC_URL environment variable is required');
    }

    this.endpoint = `http://${filerHost}`;
    this.publicEndpoint = publicUrl;

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'any',
        secretAccessKey: 'any',
      },
      forcePathStyle: true,
    });

    this.s3ClientPublic = new S3Client({
      endpoint: this.publicEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'any',
        secretAccessKey: 'any',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectName,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      this.logger.log(
        `File uploaded successfully: ${bucketName}/${objectName}`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to upload file: ${err.message}`);
      throw new Error(`Failed to upload file: ${err.message}`, {
        cause: error,
      });
    }
  }

  async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to download file: ${err.message}`);
      throw new Error(`Failed to download file: ${err.message}`, {
        cause: error,
      });
    }
  }

  async getFileStream(
    bucketName: string,
    objectName: string,
  ): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to get file stream: ${err.message}`);
      throw new Error(`Failed to get file stream: ${err.message}`, {
        cause: error,
      });
    }
  }

  async getFileMetadata(
    bucketName: string,
    objectName: string,
  ): Promise<{ size: number; contentType: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to get file metadata: ${err.message}`);
      throw new Error(`Failed to get file metadata: ${err.message}`, {
        cause: error,
      });
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${bucketName}/${objectName}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to delete file: ${err.message}`);
      throw new Error(`Failed to delete file: ${err.message}`, {
        cause: error,
      });
    }
  }

  async getPresignedUrl(
    bucketName: string,
    objectName: string,
    expirationSeconds: number = 300,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      return await getSignedUrl(this.s3ClientPublic, command, {
        expiresIn: expirationSeconds,
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to generate presigned URL: ${err.message}`);
      throw new Error(`Failed to generate presigned URL: ${err.message}`, {
        cause: error,
      });
    }
  }

  async getInternalPresignedUrl(
    bucketName: string,
    objectName: string,
    expirationSeconds: number = 300,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expirationSeconds,
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to generate internal presigned URL: ${err.message}`,
      );
      throw new Error(
        `Failed to generate internal presigned URL: ${err.message}`,
        { cause: error },
      );
    }
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      const err = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
      };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<void> {
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });

      await this.s3Client.send(command);
      this.logger.log(`Bucket created successfully: ${bucketName}`);
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      if (err.name === 'BucketAlreadyOwnedByYou') {
        this.logger.log(`Bucket already exists: ${bucketName}`);
        return;
      }
      this.logger.error(`Failed to create bucket: ${err.message}`);
      throw new Error(`Failed to create bucket: ${err.message}`, {
        cause: error,
      });
    }
  }
}

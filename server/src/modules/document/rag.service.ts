import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { SeaweedFSService } from '../../providers/seaweedfs/seaweedfs.service.js';
import { DocumentProcessorService } from './document-processor.service.js';
import { EmbeddingService } from './embedding.service.js';
import config from '../../common/config/config.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seaweedfs: SeaweedFSService,
    private readonly processor: DocumentProcessorService,
    private readonly embedding: EmbeddingService,
  ) {}

  /**
   * Returns true if the MIME type is a supported non-image document.
   * Delegates to DocumentProcessorService — exposed here so FileService
   * can decide whether to set ragStatus = 'processing' at upload time.
   */
  isDocumentMimeType(mimeType: string): boolean {
    return this.processor.isDocumentMimeType(mimeType);
  }

  /**
   * Full RAG pipeline: extract → chunk → embed → store in pgvector.
   * Only runs if extracted text exceeds LARGE_DOC_CHAR_THRESHOLD.
   * Designed to be called fire-and-forget from FileService.
   * Assumes ragStatus has already been set to 'processing' by FileService.
   */
  async processFileForRag(
    fileId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      if (!this.processor.isDocumentMimeType(mimeType)) {
        return;
      }

      const alreadyProcessed = await this.isAlreadyProcessed(fileId);
      if (alreadyProcessed) {
        this.logger.log(`File ${fileId} already processed for RAG, skipping`);
        await this.updateRagStatus(fileId, 'completed');
        return;
      }

      const text = await this.processor.extractText(buffer, mimeType);

      if (text.length < config.largeDocCharThreshold) {
        this.logger.log(
          `File ${fileId} is below threshold (${text.length} < ${config.largeDocCharThreshold} chars), skipping RAG indexing`,
        );
        await this.updateRagStatus(fileId, 'skipped');
        return;
      }

      const chunks = this.processor.chunkText(text);
      this.logger.log(
        `Processing file ${fileId} for RAG: ${chunks.length} chunks from ${text.length} chars`,
      );

      const embeddings = await this.embedding.embedBatch(chunks);
      await this.storeChunks(fileId, chunks, embeddings);
      await this.updateRagStatus(fileId, 'completed');

      this.logger.log(
        `Successfully indexed file ${fileId} for RAG (${chunks.length} chunks stored)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process file ${fileId} for RAG: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.updateRagStatus(fileId, 'failed').catch((updateErr: unknown) =>
        this.logger.warn(
          `Failed to update rag_status to failed for ${fileId}: ${updateErr instanceof Error ? updateErr.message : String(updateErr)}`,
        ),
      );
    }
  }

  /**
   * Retrieve the most relevant chunks for a query using cosine similarity.
   * Used when chunks exist (large documents).
   */
  async retrieveRelevantChunks(
    fileIds: string[],
    query: string,
    topK: number = 3,
  ): Promise<string> {
    if (fileIds.length === 0) {
      return '';
    }

    try {
      const queryEmbedding = await this.embedding.embedText(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      const chunks = await this.prisma.$queryRawUnsafe<{ content: string }[]>(
        `SELECT content
         FROM document_chunks
         WHERE file_id = ANY($1::uuid[])
         ORDER BY embedding <=> $2::vector
         LIMIT $3`,
        fileIds,
        embeddingStr,
        topK,
      );

      if (chunks.length === 0) {
        return '';
      }

      return chunks
        .map((chunk, idx) => `[Chunk ${idx + 1}]\n${chunk.content}`)
        .join('\n\n');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve relevant chunks: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }

  /**
   * Extract and return the full text of a small document by downloading from SeaweedFS.
   * Used for small documents (no chunks stored) with non-native providers.
   */
  async extractTextForSmallDoc(fileId: string): Promise<string | null> {
    try {
      const fileRecord = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: { bucketName: true, objectName: true, mimeType: true },
      });

      if (!fileRecord) {
        this.logger.warn(`File record not found for ID ${fileId}`);
        return null;
      }

      const buffer = await this.seaweedfs.downloadFile(
        fileRecord.bucketName,
        fileRecord.objectName,
      );

      const text = await this.processor.extractText(
        buffer,
        fileRecord.mimeType,
      );
      return text.trim() || null;
    } catch (error) {
      this.logger.error(
        `Failed to extract text for small doc ${fileId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Check whether a file has already been indexed (chunks stored in pgvector).
   */
  async isAlreadyProcessed(fileId: string): Promise<boolean> {
    try {
      const count = await this.prisma.documentChunk.count({
        where: { fileId },
      });
      return count > 0;
    } catch (error) {
      this.logger.warn(
        `Could not check processing status for file ${fileId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async updateRagStatus(
    fileId: string,
    status: 'processing' | 'completed' | 'skipped' | 'failed',
  ): Promise<void> {
    await this.prisma.file.update({
      where: { id: fileId },
      data: { ragStatus: status },
    });
  }

  /**
   * Store extracted chunks and their embeddings in the document_chunks table.
   * Uses raw SQL because the `embedding` column is an Unsupported pgvector type in Prisma.
   */
  private async storeChunks(
    fileId: string,
    chunks: string[],
    embeddings: number[][],
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const embeddingStr = `[${embeddings[i].join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (id, file_id, content, chunk_index, embedding, created_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, NOW())`,
        randomUUID(),
        fileId,
        chunks[i],
        i,
        embeddingStr,
      );
    }
  }
}

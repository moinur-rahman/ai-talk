import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const SUPPORTED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/csv',
  'application/json',
  'application/xml',
]);

const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  /**
   * Extract plain text from a file buffer based on its MIME type.
   */
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.extractPdf(buffer);
    }

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractDocx(buffer);
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/csv'
    ) {
      return this.extractSpreadsheet(buffer);
    }

    if (mimeType.startsWith('text/')) {
      return buffer.toString('utf-8');
    }

    // Fallback: attempt UTF-8 decode for JSON, XML, etc.
    return buffer.toString('utf-8');
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text ?? '';
    } catch (error) {
      this.logger.error(
        `PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? '';
    } catch (error) {
      this.logger.error(
        `DOCX extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error('Failed to extract text from DOCX');
    }
  }

  private extractSpreadsheet(buffer: Buffer): string {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`);
      }

      return sheets.join('\n\n');
    } catch (error) {
      this.logger.error(
        `Spreadsheet extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error('Failed to extract text from spreadsheet');
    }
  }

  /**
   * Split text into overlapping chunks.
   * Each chunk is ~2000 chars with ~200 char overlap with the previous chunk.
   */
  chunkText(text: string): string[] {
    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      const chunk = text.slice(i, i + CHUNK_SIZE).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      i += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  /**
   * Returns true if the MIME type is a supported non-image document.
   */
  isDocumentMimeType(mimeType: string): boolean {
    if (mimeType.startsWith('image/')) {
      return false;
    }

    if (mimeType.startsWith('text/')) {
      return true;
    }

    return SUPPORTED_DOCUMENT_MIME_TYPES.has(mimeType);
  }

  /**
   * Rough token count estimate: ~4 characters per token.
   */
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

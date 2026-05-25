import { Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';
import { SeaweedFSModule } from '../../providers/seaweedfs/seaweedfs.module.js';
import { DocumentProcessorService } from './document-processor.service.js';
import { EmbeddingService } from './embedding.service.js';
import { RagService } from './rag.service.js';

@Module({
  imports: [PrismaModule, SeaweedFSModule],
  providers: [DocumentProcessorService, EmbeddingService, RagService],
  exports: [RagService],
})
export class DocumentModule {}

import { Module } from '@nestjs/common';
import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';
import { SeaweedFSModule } from '../../providers/seaweedfs/seaweedfs.module.js';

@Module({
  imports: [PrismaModule, SeaweedFSModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}

import { Module, Global } from '@nestjs/common';
import { SeaweedFSService } from './seaweedfs.service.js';

@Global()
@Module({
  providers: [SeaweedFSService],
  exports: [SeaweedFSService],
})
export class SeaweedFSModule {}

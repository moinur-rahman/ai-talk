import { Module } from '@nestjs/common';
import { UsageController } from './usage.controller.js';
import { UsageService } from './usage.service.js';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}

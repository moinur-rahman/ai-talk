import { Module } from '@nestjs/common';
import { ModelController } from './model.controller.js';
import { ModelService } from './model.service.js';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelModule {}

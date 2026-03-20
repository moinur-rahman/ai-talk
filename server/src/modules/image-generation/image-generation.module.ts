import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module.js';
import { ImageGenerationController } from './image-generation.controller.js';
import { ImageGenerationService } from './image-generation.service.js';

@Module({
  imports: [LlmModule],
  controllers: [ImageGenerationController],
  providers: [ImageGenerationService],
})
export class ImageGenerationModule {}

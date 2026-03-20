import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../llm/openai/openai.service.js';
import { GenerateImageDto } from './dto/generate-image.dto.js';

@Injectable()
export class ImageGenerationService {
  constructor(private readonly openAIService: OpenAIService) {}

  async generateImage(
    dto: GenerateImageDto,
  ): Promise<{ imageDataUrl: string }> {
    return this.openAIService.generateImage(
      dto.prompt,
      dto.model,
      dto.size,
      dto.quality,
    );
  }
}

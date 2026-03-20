import { Body, Controller, Post } from '@nestjs/common';
import { ImageGenerationService } from './image-generation.service.js';
import { GenerateImageDto } from './dto/generate-image.dto.js';

@Controller('images')
export class ImageGenerationController {
  constructor(
    private readonly imageGenerationService: ImageGenerationService,
  ) {}

  @Post('generate')
  async generateImage(@Body() dto: GenerateImageDto) {
    const result = await this.imageGenerationService.generateImage(dto);
    return { data: result, message: 'Image generated successfully' };
  }
}

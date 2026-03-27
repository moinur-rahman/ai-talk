import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AudioService } from './audio.service.js';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    const transcript = await this.audioService.transcribe(file);

    return { data: { transcript }, message: 'Audio transcribed successfully' };
  }

  @Get('realtime/session')
  async createRealtimeSession() {
    const clientSecret = await this.audioService.createRealtimeSession();
    return { data: { clientSecret }, message: 'Realtime session created' };
  }

  @Post('speech')
  async textToSpeech(@Body('text') text: string, @Res() res: Response) {
    if (!text?.trim()) {
      throw new BadRequestException('Text is required');
    }

    const stream = await this.audioService.textToSpeech(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    stream.pipe(res);
  }
}

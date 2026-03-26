import { Injectable } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import config from '../../common/config/config.js';

@Injectable()
export class AudioService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async transcribe(file: Express.Multer.File): Promise<string> {
    const audioFile = await toFile(file.buffer, file.originalname, {
      type: file.mimetype,
    });

    const transcription = await this.client.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
    });

    return transcription.text;
  }

  async textToSpeech(text: string): Promise<Readable> {
    const response = await this.client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    });

    return Readable.fromWeb(response.body as ReadableStream);
  }
}

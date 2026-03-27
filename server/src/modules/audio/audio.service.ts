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

  async createRealtimeCall(
    sdp: string,
  ): Promise<{ sdpAnswer: string; callId: string }> {
    const sessionConfig = JSON.stringify({
      type: 'realtime',
      model: 'gpt-4o-mini-realtime-preview',
      audio: {
        input: { transcription: { model: 'gpt-4o-mini-transcribe' } },
        output: { voice: 'alloy' },
      },
    });

    const fd = new FormData();
    fd.set('sdp', sdp);
    fd.set('session', sessionConfig);

    const response = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      body: fd,
    });

    if (!response.ok) {
      throw new Error(`OpenAI realtime call failed: ${response.status}`);
    }

    const sdpAnswer = await response.text();
    const location = response.headers.get('Location') ?? '';
    const callId = location.split('/').pop() ?? '';

    return { sdpAnswer, callId };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import WebSocket from 'ws';
import config from '../../common/config/config.js';
import { ConversationService } from '../chat/conversation/conversation.service.js';
import { MessageService } from '../chat/message/message.service.js';
import { InputType, SenderType } from '../chat/message/dto/save-message.dto.js';
import { LlmService } from '../llm/llm.service.js';

@Injectable()
export class AudioService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(AudioService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly llmService: LlmService,
  ) {
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

  startSidebandListener(
    callId: string,
    conversationId: string | undefined,
    userId: string,
    onConversationCreated: (conversationId: string) => void,
    onTitleGenerated?: (conversationId: string, title: string) => void,
  ): void {
    this.runSidebandListener(
      callId,
      conversationId,
      userId,
      onConversationCreated,
      onTitleGenerated,
    ).catch((err: unknown) => {
      this.logger.error(
        `Sideband listener error for ${callId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  private async runSidebandListener(
    callId: string,
    conversationId: string | undefined,
    userId: string,
    onConversationCreated: (conversationId: string) => void,
    onTitleGenerated?: (conversationId: string, title: string) => void,
  ): Promise<void> {
    const url = `wss://api.openai.com/v1/realtime?call_id=${callId}`;
    const ws = new WebSocket(url, {
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
    });

    let resolvedConversationId = conversationId;
    let conversationNotified = resolvedConversationId !== undefined;
    let speechStartMs: number | null = null;

    await new Promise<void>((resolve) => {
      ws.on('message', (data) => {
        void (async () => {
          try {
            const event = JSON.parse((data as Buffer).toString()) as Record<
              string,
              unknown
            >;

            if (event.type === 'input_audio_buffer.speech_started') {
              speechStartMs = (event.audio_start_ms as number) ?? null;
            } else if (event.type === 'input_audio_buffer.speech_stopped') {
              // audio_end_ms marks the end of the speech — keep speechStartMs until
              // the transcript arrives so we can compute the duration then
              const audioEndMs = (event.audio_end_ms as number) ?? null;
              if (speechStartMs !== null && audioEndMs !== null) {
                speechStartMs = audioEndMs - speechStartMs; // reuse as computed duration
              }
            } else if (
              event.type ===
              'conversation.item.input_audio_transcription.completed'
            ) {
              const transcript = ((event.transcript as string) ?? '').trim();
              if (!transcript) {
                return;
              }

              const audioDurationMs =
                typeof speechStartMs === 'number' && speechStartMs >= 0
                  ? speechStartMs
                  : undefined;
              speechStartMs = null;

              if (!resolvedConversationId) {
                resolvedConversationId =
                  await this.conversationService.createConversation(userId);
              }

              if (!conversationNotified) {
                onConversationCreated(resolvedConversationId);
                conversationNotified = true;

                // Generate and save title in the background — mirrors text chat behavior.
                // onTitleGenerated fires once done so the caller can send a separate event.
                const idForTitle = resolvedConversationId;
                this.llmService
                  .generateConversationTitle(transcript)
                  .then(async (title) => {
                    await this.conversationService.updateTitle(
                      idForTitle,
                      title,
                    );
                    onTitleGenerated?.(idForTitle, title);
                  })
                  .catch((err: unknown) => {
                    this.logger.error(
                      `Failed to generate conversation title: ${err instanceof Error ? err.message : String(err)}`,
                    );
                    onTitleGenerated?.(idForTitle, '');
                  });
              }

              await this.messageService.saveMessage({
                mainContent: transcript,
                senderType: SenderType.user,
                inputType: InputType.voice,
                audioDurationMs,
                conversationId: resolvedConversationId,
              });
            } else if (event.type === 'response.output_audio_transcript.done') {
              const transcript = ((event.transcript as string) ?? '').trim();
              if (!transcript || !resolvedConversationId) {
                return;
              }

              await this.messageService.saveMessage({
                mainContent: transcript,
                senderType: SenderType.assistant,
                conversationId: resolvedConversationId,
              });
            }
          } catch (err: unknown) {
            this.logger.error(
              `Sideband message processing error: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        })();
      });

      ws.on('error', (err) => {
        this.logger.error(`Sideband WS error for ${callId}: ${err.message}`);
        resolve();
      });

      ws.on('close', () => {
        this.logger.log(`Sideband WS closed for ${callId}`);
        resolve();
      });
    });
  }
}

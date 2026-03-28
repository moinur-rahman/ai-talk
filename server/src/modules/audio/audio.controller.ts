import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type SessionUser,
} from '../../common/decorators/current-user.decorator.js';
import { AudioService } from './audio.service.js';

@Controller('audio')
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

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

  @Post('realtime/session')
  async createRealtimeSession(
    @Body('sdp') sdp: string,
    @Body('conversationId') conversationId: string | undefined,
    @CurrentUser() user: SessionUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!sdp?.trim()) {
      throw new BadRequestException('SDP offer is required');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { sdpAnswer, callId } =
        await this.audioService.createRealtimeCall(sdp);

      sendEvent({ type: 'session-created', sdpAnswer, callId });

      if (conversationId) {
        // Existing conversation: save messages in background, close SSE immediately
        this.audioService.startSidebandListener(
          callId,
          conversationId,
          user.id,
          () => {},
        );
      } else {
        // New conversation: keep SSE open until conversation is created AND title is generated.
        // conversation-created fires first (client navigates immediately);
        // conversation-title fires separately once the LLM finishes — mirrors text chat.
        await new Promise<void>((resolve) => {
          this.audioService.startSidebandListener(
            callId,
            undefined,
            user.id,
            (createdConversationId) => {
              sendEvent({
                type: 'conversation-created',
                conversationId: createdConversationId,
              });
            },
            (conversationId, title) => {
              if (title) {
                sendEvent({
                  type: 'conversation-title',
                  conversationId,
                  title,
                });
              }
              resolve();
            },
          );

          req.on('close', resolve);
        });
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error in realtime session: ${error instanceof Error ? error.message : String(error)}`,
      );
      sendEvent({
        type: 'error',
        message: 'Failed to create realtime session',
      });
    } finally {
      res.end();
    }
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

import {
  Body,
  Controller,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamChatDto } from './dto/stream-chat.dto.js';
import { ChatStreamService } from './chat-stream.service.js';

@Controller('chats')
export class ChatStreamController {
  private readonly logger = new Logger(ChatStreamController.name);

  constructor(private readonly chatStreamService: ChatStreamService) {}

  @Post(':conversationId/stream')
  async streamChat(
    @Param('conversationId') conversationId: string,
    @Body() dto: StreamChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let providerName: string | null = null;

    req.on('close', () => {
      if (providerName) {
        this.chatStreamService.stopStream(providerName, conversationId);
      }
    });

    try {
      await this.chatStreamService.stream(
        conversationId,
        dto,
        sendEvent,
        (resolved) => {
          providerName = resolved;
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Error in stream-chat: ${error instanceof Error ? error.message : String(error)}`,
      );
      sendEvent({
        type: 'error',
        message: 'Error fetching provider response',
        conversationId,
      });
    } finally {
      res.end();
    }
  }
}

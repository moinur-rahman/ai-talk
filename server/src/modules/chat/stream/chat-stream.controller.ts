import { Body, Controller, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamChatDto } from './dto/stream-chat.dto.js';
import { ChatStreamService } from './chat-stream.service.js';
import {
  CurrentUser,
  type SessionUser,
} from '../../../common/decorators/current-user.decorator.js';

@Controller('chats')
export class ChatStreamController {
  private readonly logger = new Logger(ChatStreamController.name);

  constructor(private readonly chatStreamService: ChatStreamService) {}

  @Post('stream')
  async streamChat(
    @Body() dto: StreamChatDto,
    @CurrentUser() user: SessionUser,
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
    let resolvedConversationId: string | null = dto.conversationId ?? null;

    req.on('close', () => {
      if (providerName && resolvedConversationId) {
        this.chatStreamService.stopStream(providerName, resolvedConversationId);
      }
    });

    try {
      await this.chatStreamService.stream(
        user.id,
        dto,
        sendEvent,
        (resolved) => {
          providerName = resolved;
        },
        (resolved) => {
          resolvedConversationId = resolved;
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Error in stream-chat: ${error instanceof Error ? error.message : String(error)}`,
      );
      sendEvent({
        type: 'error',
        message: 'Error fetching provider response',
        conversationId: resolvedConversationId,
      });
    } finally {
      res.end();
    }
  }
}

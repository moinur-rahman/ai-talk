import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessageService } from './message.service.js';
import { ConversationService } from '../conversation/conversation.service.js';

@Controller('chats/messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  @Get(':conversationId')
  async getMessagesByConversationId(
    @Param('conversationId') conversationId: string,
    @Query('switchToMessageId') switchToMessageId?: string,
  ) {
    let anchorMessageId: string | null = switchToMessageId ?? null;
    if (!anchorMessageId) {
      anchorMessageId =
        await this.conversationService.getActiveLeafMessage(conversationId);
    }

    const result = await this.messageService.getMessagesByConversationId({
      conversationId,
      anchorMessageId,
    });
    const sanitized = {
      ...result,
      messages: result.messages.map(({ openaiImageCallId: _, ...msg }) => ({
        ...msg,
        attachments: msg.attachments.map(({ storageUrl: _, ...rest }) => rest),
      })),
    };
    return { data: sanitized, message: 'Messages fetched successfully' };
  }
}

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { SessionUser } from '../../../common/decorators/current-user.decorator.js';
import { ConversationService } from './conversation.service.js';
import { UpdateConversationTitleDto } from './dto/update-conversation-title.dto.js';

@Controller('chats/conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async createConversation(@CurrentUser() user: SessionUser) {
    const conversationId = await this.conversationService.createConversation(
      user.id,
    );
    return {
      data: { conversationId },
      message: 'Conversation created successfully',
    };
  }

  @Get()
  async getConversations(@CurrentUser() user: SessionUser) {
    const conversations = await this.conversationService.getConversations(
      user.id,
    );
    return {
      data: conversations,
      message: 'Conversations fetched successfully',
    };
  }

  @Patch(':conversationId/title')
  async updateTitle(
    @Param('conversationId') conversationId: string,
    @Body() body: UpdateConversationTitleDto,
  ) {
    await this.conversationService.updateTitle(conversationId, body.title);
    return { message: 'Conversation title updated successfully' };
  }
}

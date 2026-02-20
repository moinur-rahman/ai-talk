import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';
import { UpdateConversationTitleDto } from './dto/update-conversation-title.dto.js';

@Controller('chats/conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async createConversation(@Req() req: any) {
    const conversationId = await this.conversationService.createConversation(
      req.user.id,
    );
    return { data: { conversationId }, message: 'Conversation created successfully' };
  }

  @Get()
  async getConversations(@Req() req: any) {
    const conversations = await this.conversationService.getConversations(
      req.user.id,
    );
    return { data: conversations, message: 'Conversations fetched successfully' };
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

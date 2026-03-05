import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { SessionUser } from '../../../common/decorators/current-user.decorator.js';
import { ConversationService } from './conversation.service.js';
import { UpdateConversationTitleDto } from './dto/update-conversation-title.dto.js';
import { GetConversationsQueryDto } from './dto/get-conversations-query.dto.js';
import { SearchConversationsQueryDto } from './dto/search-conversations-query.dto.js';

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
  async getConversations(
    @CurrentUser() user: SessionUser,
    @Query() query: GetConversationsQueryDto,
  ) {
    const result = await this.conversationService.getConversations(
      user.id,
      query.limit,
      query.cursor,
    );
    return {
      data: result,
      message: 'Conversations fetched successfully',
    };
  }

  @Get('search')
  async searchConversations(
    @CurrentUser() user: SessionUser,
    @Query() query: SearchConversationsQueryDto,
  ) {
    const results = await this.conversationService.searchConversations(
      user.id,
      query.q,
    );
    return { data: results, message: 'Search results' };
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

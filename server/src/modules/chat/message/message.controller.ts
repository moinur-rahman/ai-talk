import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessageService } from './message.service.js';
import { SaveMessageDto } from './dto/save-message.dto.js';

@Controller('chats/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async saveMessage(@Body() body: SaveMessageDto) {
    await this.messageService.saveMessage(body);
    return { message: 'Message saved successfully' };
  }

  @Get(':conversationId')
  async getMessagesByConversationId(
    @Param('conversationId') conversationId: string,
  ) {
    const result =
      await this.messageService.getMessagesByConversationId(conversationId);
    return { data: result, message: 'Messages fetched successfully' };
  }
}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';
import { FileModule } from '../file/file.module.js';
import { ConversationController } from './conversation/conversation.controller.js';
import { ConversationService } from './conversation/conversation.service.js';
import { MessageController } from './message/message.controller.js';
import { MessageService } from './message/message.service.js';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [ConversationController, MessageController],
  providers: [ConversationService, MessageService],
  exports: [ConversationService, MessageService],
})
export class ChatModule {}

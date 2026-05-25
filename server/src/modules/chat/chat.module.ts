import { Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module.js';
import { FileModule } from '../file/file.module.js';
import { LlmModule } from '../llm/llm.module.js';
import { ModelModule } from '../model/model.module.js';
import { ProjectModule } from '../project/project.module.js';
import { UserModule } from '../user/user.module.js';
import { DocumentModule } from '../document/document.module.js';
import { ConversationController } from './conversation/conversation.controller.js';
import { ConversationService } from './conversation/conversation.service.js';
import { MessageController } from './message/message.controller.js';
import { MessageService } from './message/message.service.js';
import { ChatStreamController } from './stream/chat-stream.controller.js';
import { ChatStreamService } from './stream/chat-stream.service.js';

@Module({
  imports: [
    PrismaModule,
    FileModule,
    LlmModule,
    ModelModule,
    ProjectModule,
    UserModule,
    DocumentModule,
  ],
  controllers: [
    ConversationController,
    MessageController,
    ChatStreamController,
  ],
  providers: [ConversationService, MessageService, ChatStreamService],
  exports: [ConversationService, MessageService],
})
export class ChatModule {}

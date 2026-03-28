import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module.js';
import { LlmModule } from '../llm/llm.module.js';
import { AudioController } from './audio.controller.js';
import { AudioService } from './audio.service.js';

@Module({
  imports: [ChatModule, LlmModule],
  controllers: [AudioController],
  providers: [AudioService],
})
export class AudioModule {}

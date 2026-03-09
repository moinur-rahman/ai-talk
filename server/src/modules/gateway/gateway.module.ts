import { Module } from '@nestjs/common';
import { ProviderGateway } from './provider.gateway.js';
import { AuthGateway } from './auth.gateway.js';
import { RedisSubscriberService } from '../../providers/redis/redis-subscriber.service.js';
import { LlmModule } from '../llm/llm.module.js';
import { ModelModule } from '../model/model.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { FileModule } from '../file/file.module.js';

@Module({
  imports: [LlmModule, ModelModule, ChatModule, FileModule],
  providers: [ProviderGateway, AuthGateway, RedisSubscriberService],
})
export class GatewayModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './providers/prisma/prisma.module.js';
import { RedisModule } from './providers/redis/redis.module.js';
import { SeaweedFSModule } from './providers/seaweedfs/seaweedfs.module.js';
import { OpenAIClientModule } from './providers/openai/openai-client.module.js';
import { OpenRouterClientModule } from './providers/openrouter/openrouter-client.module.js';
import { OllamaClientModule } from './providers/ollama/ollama-client.module.js';
import { ZaiClientModule } from './providers/zai/zai-client.module.js';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ModelModule } from './modules/model/model.module.js';
import { FileModule } from './modules/file/file.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ProjectModule } from './modules/project/project.module.js';
import { ImageGenerationModule } from './modules/image-generation/image-generation.module.js';
import { AudioModule } from './modules/audio/audio.module.js';
import { UsageModule } from './modules/usage/usage.module.js';
import { AuthenticatedGuard } from './modules/auth/guards/authenticated.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    SeaweedFSModule,
    OpenAIClientModule,
    OpenRouterClientModule,
    OllamaClientModule,
    ZaiClientModule,
    UserModule,
    AuthModule,
    ModelModule,
    FileModule,
    ChatModule,
    ProjectModule,
    ImageGenerationModule,
    AudioModule,
    UsageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard,
    },
  ],
})
export class AppModule {}

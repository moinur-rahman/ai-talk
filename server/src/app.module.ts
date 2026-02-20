import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './providers/prisma/prisma.module.js';
import { RedisModule } from './providers/redis/redis.module.js';
import { SeaweedFSModule } from './providers/seaweedfs/seaweedfs.module.js';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ModelModule } from './modules/model/model.module.js';
import { FileModule } from './modules/file/file.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { GatewayModule } from './modules/gateway/gateway.module.js';
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
    UserModule,
    AuthModule,
    ModelModule,
    FileModule,
    ChatModule,
    GatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard,
    },
  ],
})
export class AppModule {}

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import config from '../../common/config/config.js';
import { SESSION_KEY_PREFIX } from '../../common/config/constants.js';
import { AuthGateway } from '../../modules/gateway/auth.gateway.js';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private subscriberClient: RedisClientType;

  constructor(private readonly authGateway: AuthGateway) {}

  async onModuleInit() {
    this.subscriberClient = createClient({
      socket: { host: config.redisHost, port: config.redisPort },
      password: config.redisPassword || undefined,
    }) as RedisClientType;

    this.subscriberClient.on('error', (err) => {
      this.logger.error('Redis subscriber client error', err);
    });

    await this.subscriberClient.connect();

    await this.subscriberClient.subscribe(
      ['__keyevent@0__:expired', '__keyevent@0__:del'],
      (message) => {
        if (message.startsWith(SESSION_KEY_PREFIX)) {
          const sessionId = message.slice(SESSION_KEY_PREFIX.length);
          this.authGateway.notifySessionExpired(sessionId);
        }
      },
    );

    this.logger.log('Redis session expiry subscriber initialized');
  }

  async onModuleDestroy() {
    await this.subscriberClient?.quit();
  }
}

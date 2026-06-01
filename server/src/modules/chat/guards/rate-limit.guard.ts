import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../../providers/redis/redis.service.js';
import { AuthenticatedRequest } from '../../auth/auth.types.js';
import config from '../../../common/config/config.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = req.user?.id;
    const body = req.body as { lastModelId?: string };
    const modelId = body.lastModelId ?? 'default';
    const key = `rl:${userId}:${modelId}`;

    const now = Date.now();
    const windowMs = config.rateLimitWindowSeconds * 1000;
    const client = this.redisService.getClient();

    await client.zRemRangeByScore(key, '-inf', now - windowMs);
    const count = await client.zCard(key);

    if (count >= config.rateLimitMaxRequests) {
      throw new HttpException(
        'Rate limit exceeded. Try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await client.zAdd(key, { score: now, value: randomUUID() });
    await client.expire(key, config.rateLimitWindowSeconds * 2);

    return true;
  }
}

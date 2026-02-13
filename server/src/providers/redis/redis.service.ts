import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import config from '../../common/config/config.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;

  async onModuleInit() {
    this.redisClient = createClient({
      socket: {
        host: config.redisHost,
        port: config.redisPort,
      },
      password: config.redisPassword,
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis connection closed');
    }
  }

  // Get the underlying client for session store
  getClient(): RedisClientType {
    return this.redisClient;
  }

  // Utility methods for future caching needs
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async setWithExpiry(key: string, value: string, expiry: number): Promise<void> {
    await this.redisClient.set(key, value, { EX: expiry });
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) === 1;
  }
}

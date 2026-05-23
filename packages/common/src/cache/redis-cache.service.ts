import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { logger } from '@rewards/logger';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  constructor(private readonly redisUrl: string) {}

  async onModuleInit(): Promise<void> {
    this.client = createClient({ url: this.redisUrl }) as RedisClientType;
    this.client.on('error', (err) => logger.error(err, 'Redis client error'));
    await this.client.connect();
    logger.info('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.disconnect();
    logger.info('Redis disconnected');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  static userProfileKey(userId: string): string {
    return `user:profile:${userId}`;
  }

  static rewardBalanceKey(userId: string): string {
    return `reward:balance:${userId}`;
  }

  static walletBalanceKey(userId: string): string {
    return `wallet:balance:${userId}`;
  }
}

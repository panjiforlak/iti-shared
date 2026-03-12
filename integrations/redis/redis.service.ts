import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly logger: PinoLogger,
  ) {}

  async get<T = any>(key: string, fallback?: T): Promise<T | null> {
    try {
      this.logger.info({ key }, 'REDIS_GET::REQUEST');

      const data = await this.redis.get(key);

      if (!data) return fallback ?? null;

      this.logger.info({ key }, 'REDIS_GET::SUCCESS');

      return JSON.parse(data);
    } catch (error) {
      this.logger.error({ key, error }, 'REDIS_GET::ERROR');

      return fallback ?? null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      this.logger.info({ key, ttl }, 'REDIS_SET::REQUEST');

      const val = JSON.stringify(value);

      if (ttl) {
        await this.redis.set(key, val, 'EX', ttl);
      } else {
        await this.redis.set(key, val);
      }

      this.logger.info({ key }, 'REDIS_SET::SUCCESS');

      return true;
    } catch (error) {
      this.logger.error({ key, error }, 'REDIS_SET::ERROR');
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      this.logger.info({ key }, 'REDIS_DEL::REQUEST');

      await this.redis.del(key);

      this.logger.info({ key }, 'REDIS_DEL::SUCCESS');

      return true;
    } catch (error) {
      this.logger.error({ key, error }, 'REDIS_DEL::ERROR');
      return false;
    }
  }
}

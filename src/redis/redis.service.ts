import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly redisManager: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisManager = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async set(key: string, value: any, ttl?: number) {
    try {
      if (ttl) {
        await this.redisManager.setex(key, ttl, JSON.stringify(value)); // setex sets the value with TTL
      } else {
        await this.redisManager.set(key, value); // Set without TTL
      }

      const storedValue = await this.get(key);

      return storedValue;
    } catch (error) {
      console.error('An error occurred while setting value in Redis:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.redisManager.get(key);
    return await this.redisManager.get(key);
  }

  async delete(key: string) {
    return await this.redisManager.del(key);
  }
}

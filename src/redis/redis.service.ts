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
      console.log('Trying to set value');

      if (ttl) {
        console.log('TTL is present:', ttl);
        await this.redisManager.setex(key, ttl, JSON.stringify(value)); // setex sets the value with TTL
      } else {
        console.log('No TTL provided');
        await this.redisManager.set(key, JSON.stringify(value)); // Set without TTL
      }

      const storedValue = await this.get(key);
      console.log('Value from store is:', storedValue);

      return storedValue;
    } catch (error) {
      console.error('An error occurred while setting value in Redis:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.redisManager.get(key);
    console.log('this key', value);
    return await this.redisManager.get(key);
  }

  async delete(key: string) {
    return await this.redisManager.del(key);
  }
}

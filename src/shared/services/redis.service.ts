import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis服务
 * 提供Redis连接和基础操作方法
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  /**
   * 模块初始化时连接Redis
   */
  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    await this.client.connect();
  }

  /**
   * 模块销毁时断开Redis连接
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  /**
   * 获取Redis客户端实例
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * 获取键值
   * @param key 键
   * @returns 值或null
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * 删除键
   * @param key 键
   * @returns 删除的键数量
   */
  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * 检查键是否存在
   * @param key 键
   * @returns 是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 设置键的过期时间
   * @param key 键
   * @param ttl 过期时间（秒）
   * @returns 是否设置成功
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const result = await this.client.expire(key, ttl);
    return result === 1;
  }

  /**
   * 获取键的剩余过期时间
   * @param key 键
   * @returns 剩余秒数，-1表示永不过期，-2表示键不存在
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  /**
   * 设置JSON对象
   * @param key 键
   * @param value JSON对象
   * @param ttl 过期时间（秒），可选
   */
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, ttl);
  }

  /**
   * 获取JSON对象
   * @param key 键
   * @returns JSON对象或null
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    const jsonString = await this.get(key);
    if (!jsonString) {
      return null;
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON from Redis:', error);
      return null;
    }
  }

  /**
   * 原子性递增
   * @param key 键
   * @param increment 递增值，默认为1
   * @returns 递增后的值
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    if (increment === 1) {
      return await this.client.incr(key);
    } else {
      return await this.client.incrBy(key, increment);
    }
  }

  /**
   * 原子性递减
   * @param key 键
   * @param decrement 递减值，默认为1
   * @returns 递减后的值
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    if (decrement === 1) {
      return await this.client.decr(key);
    } else {
      return await this.client.decrBy(key, decrement);
    }
  }

  /**
   * 批量设置键值对
   * @param keyValuePairs 键值对数组
   */
  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    await this.client.mSet(keyValuePairs);
  }

  /**
   * 批量获取键值
   * @param keys 键数组
   * @returns 值数组
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.client.mGet(keys);
  }

  /**
   * 获取所有匹配的键
   * @param pattern 匹配模式
   * @returns 键数组
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  /**
   * 清空当前数据库
   */
  async flushdb(): Promise<void> {
    await this.client.flushDb();
  }

  /**
   * 清空所有数据库
   */
  async flushall(): Promise<void> {
    await this.client.flushAll();
  }

  /**
   * 获取数据库信息
   * @returns 数据库信息
   */
  async info(): Promise<string> {
    return await this.client.info();
  }

  /**
   * 获取数据库大小
   * @returns 键的数量
   */
  async dbsize(): Promise<number> {
    return await this.client.dbSize();
  }
}

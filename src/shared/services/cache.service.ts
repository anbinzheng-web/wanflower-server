import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * 缓存服务
 * 基于Redis提供高级缓存功能
 */
@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  /**
   * 缓存键前缀
   */
  private readonly CACHE_PREFIX = 'wanflower:cache:';

  /**
   * 生成完整的缓存键
   * @param key 原始键
   * @returns 完整缓存键
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），默认1小时
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    await this.redisService.setJson(cacheKey, value, ttl);
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或null
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);
    return await this.redisService.getJson<T>(cacheKey);
  }

  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  async del(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    const result = await this.redisService.del(cacheKey);
    return result > 0;
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  async exists(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    return await this.redisService.exists(cacheKey);
  }

  /**
   * 设置缓存过期时间
   * @param key 缓存键
   * @param ttl 过期时间（秒）
   * @returns 是否设置成功
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    return await this.redisService.expire(cacheKey, ttl);
  }

  /**
   * 获取缓存剩余过期时间
   * @param key 缓存键
   * @returns 剩余秒数
   */
  async ttl(key: string): Promise<number> {
    const cacheKey = this.getCacheKey(key);
    return await this.redisService.ttl(cacheKey);
  }

  /**
   * 获取或设置缓存
   * 如果缓存存在则返回缓存值，否则执行回调函数并将结果缓存
   * @param key 缓存键
   * @param callback 回调函数
   * @param ttl 过期时间（秒），默认1小时
   * @returns 缓存值或回调函数结果
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * 批量删除缓存
   * @param pattern 匹配模式
   * @returns 删除的键数量
   */
  async delPattern(pattern: string): Promise<number> {
    const cachePattern = this.getCacheKey(pattern);
    const keys = await this.redisService.keys(cachePattern);
    
    if (keys.length === 0) {
      return 0;
    }

    let deletedCount = 0;
    for (const key of keys) {
      const result = await this.redisService.del(key);
      deletedCount += result;
    }

    return deletedCount;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await this.delPattern('*');
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计信息
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    const info = await this.redisService.info();
    const dbsize = await this.redisService.dbsize();
    
    // 解析Redis INFO命令返回的内存使用信息
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

    return {
      totalKeys: dbsize,
      memoryUsage,
    };
  }

  /**
   * 缓存用户会话
   * @param userId 用户ID
   * @param sessionData 会话数据
   * @param ttl 过期时间（秒），默认7天
   */
  async setUserSession(userId: string, sessionData: any, ttl: number = 604800): Promise<void> {
    const key = `user:session:${userId}`;
    await this.set(key, sessionData, ttl);
  }

  /**
   * 获取用户会话
   * @param userId 用户ID
   * @returns 会话数据或null
   */
  async getUserSession<T = any>(userId: string): Promise<T | null> {
    const key = `user:session:${userId}`;
    return await this.get<T>(key);
  }

  /**
   * 删除用户会话
   * @param userId 用户ID
   * @returns 是否删除成功
   */
  async delUserSession(userId: string): Promise<boolean> {
    const key = `user:session:${userId}`;
    return await this.del(key);
  }

  /**
   * 缓存API响应
   * @param endpoint API端点
   * @param params 请求参数
   * @param response 响应数据
   * @param ttl 过期时间（秒），默认30分钟
   */
  async setApiResponse(
    endpoint: string,
    params: any,
    response: any,
    ttl: number = 1800
  ): Promise<void> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    await this.set(key, response, ttl);
  }

  /**
   * 获取API响应缓存
   * @param endpoint API端点
   * @param params 请求参数
   * @returns 响应数据或null
   */
  async getApiResponse<T = any>(endpoint: string, params: any): Promise<T | null> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.get<T>(key);
  }

  /**
   * 删除API响应缓存
   * @param endpoint API端点
   * @param params 请求参数
   * @returns 是否删除成功
   */
  async delApiResponse(endpoint: string, params: any): Promise<boolean> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.del(key);
  }

  /**
   * 缓存产品信息
   * @param productId 产品ID
   * @param productData 产品数据
   * @param ttl 过期时间（秒），默认1小时
   */
  async setProduct(productId: string, productData: any, ttl: number = 3600): Promise<void> {
    const key = `product:${productId}`;
    await this.set(key, productData, ttl);
  }

  /**
   * 获取产品信息缓存
   * @param productId 产品ID
   * @returns 产品数据或null
   */
  async getProduct<T = any>(productId: string): Promise<T | null> {
    const key = `product:${productId}`;
    return await this.get<T>(key);
  }

  /**
   * 删除产品信息缓存
   * @param productId 产品ID
   * @returns 是否删除成功
   */
  async delProduct(productId: string): Promise<boolean> {
    const key = `product:${productId}`;
    return await this.del(key);
  }

  /**
   * 缓存用户信息
   * @param userId 用户ID
   * @param userData 用户数据
   * @param ttl 过期时间（秒），默认30分钟
   */
  async setUser(userId: string, userData: any, ttl: number = 1800): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, userData, ttl);
  }

  /**
   * 获取用户信息缓存
   * @param userId 用户ID
   * @returns 用户数据或null
   */
  async getUser<T = any>(userId: string): Promise<T | null> {
    const key = `user:${userId}`;
    return await this.get<T>(key);
  }

  /**
   * 删除用户信息缓存
   * @param userId 用户ID
   * @returns 是否删除成功
   */
  async delUser(userId: string): Promise<boolean> {
    const key = `user:${userId}`;
    return await this.del(key);
  }
}

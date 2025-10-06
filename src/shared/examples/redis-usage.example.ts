import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { CacheService } from '../services/cache.service';

/**
 * Redis使用示例
 * 展示如何在业务服务中使用Redis和Cache服务
 */
@Injectable()
export class RedisUsageExample {
  constructor(
    private redisService: RedisService,
    private cacheService: CacheService,
  ) {}

  /**
   * 示例1：基础Redis操作
   */
  async basicRedisOperations() {
    // 设置键值对
    await this.redisService.set('user:1:name', 'John Doe', 3600);
    
    // 获取值
    const userName = await this.redisService.get('user:1:name');
    console.log('用户名:', userName);
    
    // 设置JSON对象
    const userData = { id: 1, name: 'John Doe', email: 'john@example.com' };
    await this.redisService.setJson('user:1', userData, 3600);
    
    // 获取JSON对象
    const user = await this.redisService.getJson('user:1');
    console.log('用户数据:', user);
    
    // 检查键是否存在
    const exists = await this.redisService.exists('user:1');
    console.log('用户数据是否存在:', exists);
    
    // 删除键
    await this.redisService.del('user:1:name');
  }

  /**
   * 示例2：高级缓存操作
   */
  async advancedCacheOperations() {
    // 设置缓存
    const productData = { id: 1, name: '商品1', price: 99.99 };
    await this.cacheService.setProduct('1', productData, 3600);
    
    // 获取缓存
    const cachedProduct = await this.cacheService.getProduct('1');
    console.log('缓存的产品:', cachedProduct);
    
    // 获取或设置缓存（防止缓存穿透）
    const expensiveData = await this.cacheService.getOrSet(
      'expensive-calculation',
      async () => {
        // 模拟昂贵的计算
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { result: '计算结果', timestamp: new Date() };
      },
      1800 // 30分钟过期
    );
    console.log('昂贵计算结果:', expensiveData);
  }

  /**
   * 示例3：用户会话管理
   */
  async userSessionManagement() {
    const userId = 'user123';
    const sessionData = {
      userId,
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      loginTime: new Date(),
      lastActivity: new Date(),
    };

    // 设置用户会话
    await this.cacheService.setUserSession(userId, sessionData, 604800); // 7天

    // 获取用户会话
    const session = await this.cacheService.getUserSession(userId);
    console.log('用户会话:', session);

    // 更新会话活动时间
    if (session) {
      session.lastActivity = new Date();
      await this.cacheService.setUserSession(userId, session, 604800);
    }

    // 删除用户会话（登出）
    await this.cacheService.delUserSession(userId);
  }

  /**
   * 示例4：API响应缓存
   */
  async apiResponseCaching() {
    const endpoint = 'products';
    const queryParams = { page: 1, limit: 10, category: 'electronics' };

    // 尝试从缓存获取API响应
    let response = await this.cacheService.getApiResponse(endpoint, queryParams);

    if (!response) {
      // 缓存未命中，从数据库获取数据
      console.log('缓存未命中，从数据库获取数据');
      response = await this.fetchProductsFromDatabase(queryParams);
      
      // 缓存API响应
      await this.cacheService.setApiResponse(endpoint, queryParams, response, 1800);
    } else {
      console.log('从缓存获取数据');
    }

    return response;
  }

  /**
   * 示例5：批量操作
   */
  async batchOperations() {
    // 批量设置
    const userData = {
      'user:1': JSON.stringify({ id: 1, name: 'User 1' }),
      'user:2': JSON.stringify({ id: 2, name: 'User 2' }),
      'user:3': JSON.stringify({ id: 3, name: 'User 3' }),
    };
    await this.redisService.mset(userData);

    // 批量获取
    const keys = ['user:1', 'user:2', 'user:3'];
    const users = await this.redisService.mget(keys);
    console.log('批量获取的用户:', users);

    // 批量删除
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }

  /**
   * 示例6：原子性操作
   */
  async atomicOperations() {
    const counterKey = 'page:views:home';

    // 原子性递增
    const newCount = await this.redisService.incr(counterKey);
    console.log('页面访问次数:', newCount);

    // 原子性递减
    const decrementedCount = await this.redisService.decr(counterKey);
    console.log('递减后的访问次数:', decrementedCount);

    // 设置过期时间
    await this.redisService.expire(counterKey, 86400); // 24小时过期
  }

  /**
   * 示例7：模式匹配和清理
   */
  async patternMatchingAndCleanup() {
    // 设置一些测试数据
    await this.redisService.set('temp:data:1', 'value1');
    await this.redisService.set('temp:data:2', 'value2');
    await this.redisService.set('user:session:1', 'session1');
    await this.redisService.set('user:session:2', 'session2');

    // 查找匹配的键
    const tempKeys = await this.redisService.keys('temp:*');
    console.log('临时数据键:', tempKeys);

    const sessionKeys = await this.redisService.keys('user:session:*');
    console.log('会话键:', sessionKeys);

    // 批量删除临时数据
    for (const key of tempKeys) {
      await this.redisService.del(key);
    }

    // 使用缓存服务清理特定模式的缓存
    const deletedCount = await this.cacheService.delPattern('user:*');
    console.log('删除的缓存数量:', deletedCount);
  }

  /**
   * 示例8：缓存统计和监控
   */
  async cacheStatisticsAndMonitoring() {
    // 获取缓存统计信息
    const stats = await this.cacheService.getStats();
    console.log('缓存统计:', stats);

    // 检查特定缓存是否存在
    const hasProductCache = await this.cacheService.exists('product:1');
    console.log('产品缓存是否存在:', hasProductCache);

    // 获取缓存的剩余过期时间
    const ttl = await this.cacheService.ttl('product:1');
    console.log('产品缓存剩余时间:', ttl, '秒');

    // 设置缓存过期时间
    await this.cacheService.expire('product:1', 7200); // 2小时
  }

  /**
   * 模拟从数据库获取产品数据
   */
  private async fetchProductsFromDatabase(params: any) {
    // 模拟数据库查询延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      products: [
        { id: 1, name: '商品1', price: 99.99 },
        { id: 2, name: '商品2', price: 199.99 },
      ],
      total: 2,
      page: params.page,
      limit: params.limit,
    };
  }
}

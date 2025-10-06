#!/usr/bin/env ts-node

/**
 * Redis连接测试脚本
 * 用于验证Redis配置是否正确
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/shared/services/redis.service';
import { CacheService } from '../src/shared/services/cache.service';
import { RedisHealthService } from '../src/shared/services/redis-health.service';

async function testRedisConnection() {
  console.log('🚀 开始测试Redis连接...\n');

  try {
    // 创建NestJS应用实例
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // 获取服务实例
    const redisService = app.get(RedisService);
    const cacheService = app.get(CacheService);
    const redisHealthService = app.get(RedisHealthService);

    // 测试1: 基础连接测试
    console.log('📡 测试1: 基础连接测试');
    const connectionStatus = await redisHealthService.checkConnection();
    console.log('连接状态:', connectionStatus);
    console.log('');

    // 测试2: 基础Redis操作
    console.log('🔧 测试2: 基础Redis操作');
    await redisService.set('test:key', 'Hello Redis!', 60);
    const value = await redisService.get('test:key');
    console.log('设置和获取值:', value);
    
    const exists = await redisService.exists('test:key');
    console.log('键是否存在:', exists);
    
    await redisService.del('test:key');
    console.log('删除键完成');
    console.log('');

    // 测试3: JSON操作
    console.log('📄 测试3: JSON操作');
    const testData = { id: 1, name: '测试用户', email: 'test@example.com' };
    await redisService.setJson('test:user', testData, 60);
    const retrievedData = await redisService.getJson('test:user');
    console.log('JSON数据:', retrievedData);
    await redisService.del('test:user');
    console.log('');

    // 测试4: 高级缓存操作
    console.log('💾 测试4: 高级缓存操作');
    await cacheService.set('test:cache', { message: '缓存测试' }, 60);
    const cachedData = await cacheService.get('test:cache');
    console.log('缓存数据:', cachedData);
    
    // 测试getOrSet
    const expensiveData = await cacheService.getOrSet(
      'test:expensive',
      async () => {
        console.log('执行昂贵的操作...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: '昂贵操作结果', timestamp: new Date() };
      },
      60
    );
    console.log('getOrSet结果:', expensiveData);
    console.log('');

    // 测试5: 服务器信息
    console.log('📊 测试5: 服务器信息');
    const serverInfo = await redisHealthService.getServerInfo();
    console.log('Redis服务器信息:', serverInfo);
    console.log('');

    // 测试6: 内存使用情况
    console.log('🧠 测试6: 内存使用情况');
    const memoryUsage = await redisHealthService.checkMemoryUsage();
    console.log('内存使用情况:', memoryUsage);
    console.log('');

    // 测试7: 性能测试
    console.log('⚡ 测试7: 性能测试');
    const performance = await redisHealthService.performanceTest(100);
    console.log('性能测试结果:', performance);
    console.log('');

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await cacheService.del('test:cache');
    await cacheService.del('test:expensive');
    console.log('清理完成');

    console.log('✅ Redis连接测试完成！所有测试通过。');

    // 关闭应用
    await app.close();

  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    console.error('请检查:');
    console.error('1. Redis服务是否正在运行');
    console.error('2. 环境变量配置是否正确');
    console.error('3. 网络连接是否正常');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testRedisConnection();
}

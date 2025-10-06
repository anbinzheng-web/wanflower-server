#!/usr/bin/env ts-node

/**
 * 简化的Redis连接测试脚本
 * 直接测试Redis连接，不依赖完整的NestJS应用
 */

import { createClient, RedisClientType } from 'redis';

async function testRedisConnection() {
  console.log('🚀 开始测试Redis连接...\n');

  let client: RedisClientType | undefined;

  try {
    // 创建Redis客户端
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('连接Redis:', redisUrl);

    client = createClient({
      url: redisUrl,
    });

    // 设置事件监听器
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('✅ Redis Client Ready');
    });

    client.on('end', () => {
      console.log('📴 Redis Client Disconnected');
    });

    // 连接Redis
    await client.connect();

    // 测试1: PING命令
    console.log('\n📡 测试1: PING命令');
    const pong = await client.ping();
    console.log('PING响应:', pong);

    // 测试2: 基础键值操作
    console.log('\n🔧 测试2: 基础键值操作');
    await client.set('test:key', 'Hello Redis!', { EX: 60 });
    const value = await client.get('test:key');
    console.log('设置和获取值:', value);

    const exists = await client.exists('test:key');
    console.log('键是否存在:', exists === 1);

    await client.del('test:key');
    console.log('删除键完成');

    // 测试3: JSON操作
    console.log('\n📄 测试3: JSON操作');
    const testData = { id: 1, name: '测试用户', email: 'test@example.com' };
    await client.set('test:user', JSON.stringify(testData), { EX: 60 });
    const retrievedData = await client.get('test:user');
    console.log('JSON数据:', JSON.parse(retrievedData || '{}'));

    // 测试4: 原子性操作
    console.log('\n⚡ 测试4: 原子性操作');
    await client.set('test:counter', '0');
    const newCount = await client.incr('test:counter');
    console.log('递增计数:', newCount);

    const decrementedCount = await client.decr('test:counter');
    console.log('递减计数:', decrementedCount);

    // 测试5: 过期时间
    console.log('\n⏰ 测试5: 过期时间');
    await client.set('test:expire', 'expire test', { EX: 5 });
    const ttl = await client.ttl('test:expire');
    console.log('剩余过期时间:', ttl, '秒');

    // 测试6: 批量操作
    console.log('\n📦 测试6: 批量操作');
    await client.mSet({
      'test:batch:1': 'value1',
      'test:batch:2': 'value2',
      'test:batch:3': 'value3',
    });

    const batchValues = await client.mGet(['test:batch:1', 'test:batch:2', 'test:batch:3']);
    console.log('批量获取值:', batchValues);

    // 测试7: 模式匹配
    console.log('\n🔍 测试7: 模式匹配');
    const keys = await client.keys('test:batch:*');
    console.log('匹配的键:', keys);

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await client.del('test:user');
    await client.del('test:counter');
    await client.del('test:expire');
    for (const key of keys) {
      await client.del(key);
    }
    console.log('清理完成');

    // 测试8: 服务器信息
    console.log('\n📊 测试8: 服务器信息');
    const info = await client.info();
    const lines = info.split('\r\n');
    
    const serverInfo: any = {};
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        switch (key) {
          case 'redis_version':
            serverInfo.version = value;
            break;
          case 'used_memory_human':
            serverInfo.memory = value;
            break;
          case 'connected_clients':
            serverInfo.connectedClients = value;
            break;
        }
      }
    }
    console.log('Redis服务器信息:', serverInfo);

    // 测试9: 数据库大小
    console.log('\n📈 测试9: 数据库大小');
    const dbSize = await client.dbSize();
    console.log('数据库键数量:', dbSize);

    console.log('\n✅ Redis连接测试完成！所有测试通过。');

  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    console.error('请检查:');
    console.error('1. Redis服务是否正在运行');
    console.error('2. 环境变量配置是否正确');
    console.error('3. 网络连接是否正常');
    process.exit(1);
  } finally {
    // 关闭连接
    if (client) {
      await client.disconnect();
    }
  }
}

// 运行测试
if (require.main === module) {
  testRedisConnection();
}

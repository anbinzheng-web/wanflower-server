# Redis 配置指南

## 概述

本项目已集成Redis支持，提供缓存和会话管理功能。Redis服务通过`RedisService`和`CacheService`两个服务类提供不同层次的缓存功能。

## 环境配置

### 开发环境

在项目根目录创建`.env`文件，添加以下Redis配置：

```bash
# Redis配置 - 开发环境连接本地Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

### 生产环境

生产环境建议使用密码保护的Redis实例：

```bash
# Redis配置 - 生产环境
REDIS_URL="redis://:password@redis-server:6379"
REDIS_HOST="redis-server"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
REDIS_DB="0"
```

## 服务说明

### RedisService

基础的Redis操作服务，提供：

- 键值对操作（set, get, del, exists）
- 过期时间管理（expire, ttl）
- JSON对象存储（setJson, getJson）
- 原子性操作（incr, decr）
- 批量操作（mset, mget）
- 键模式匹配（keys）
- 数据库管理（flushdb, flushall）

### CacheService

高级缓存服务，基于RedisService提供：

- 带前缀的缓存键管理
- 缓存穿透保护（getOrSet方法）
- 业务相关的缓存方法：
  - 用户会话缓存
  - API响应缓存
  - 产品信息缓存
  - 用户信息缓存
- 缓存统计和监控

## 使用示例

### 基础Redis操作

```typescript
import { RedisService } from '@/shared/services/redis.service';

@Injectable()
export class MyService {
  constructor(private redisService: RedisService) {}

  async example() {
    // 设置键值对
    await this.redisService.set('key', 'value', 3600);
    
    // 获取值
    const value = await this.redisService.get('key');
    
    // 设置JSON对象
    await this.redisService.setJson('user:1', { id: 1, name: 'John' });
    
    // 获取JSON对象
    const user = await this.redisService.getJson('user:1');
  }
}
```

### 高级缓存操作

```typescript
import { CacheService } from '@/shared/services/cache.service';

@Injectable()
export class MyService {
  constructor(private cacheService: CacheService) {}

  async example() {
    // 设置缓存
    await this.cacheService.set('product:123', productData, 3600);
    
    // 获取缓存
    const product = await this.cacheService.get('product:123');
    
    // 获取或设置缓存（防止缓存穿透）
    const data = await this.cacheService.getOrSet(
      'expensive-operation',
      async () => {
        // 执行昂贵的操作
        return await this.performExpensiveOperation();
      },
      3600
    );
    
    // 缓存用户会话
    await this.cacheService.setUserSession('user123', sessionData);
    
    // 获取用户会话
    const session = await this.cacheService.getUserSession('user123');
  }
}
```

## 缓存策略建议

### 1. 产品信息缓存

```typescript
// 缓存产品详情
await this.cacheService.setProduct(productId, productData, 3600);

// 获取产品详情
const product = await this.cacheService.getProduct(productId);
if (!product) {
  // 从数据库加载并缓存
  const productData = await this.productService.findById(productId);
  await this.cacheService.setProduct(productId, productData, 3600);
  return productData;
}
```

### 2. 用户会话缓存

```typescript
// 登录时缓存会话
await this.cacheService.setUserSession(userId, {
  userId,
  role: user.role,
  permissions: user.permissions,
  loginTime: new Date()
}, 604800); // 7天

// 验证会话
const session = await this.cacheService.getUserSession(userId);
if (!session) {
  throw new UnauthorizedException('会话已过期');
}
```

### 3. API响应缓存

```typescript
// 缓存API响应
const cacheKey = `api:products:list:${JSON.stringify(queryParams)}`;
let result = await this.cacheService.get(cacheKey);

if (!result) {
  result = await this.productService.findMany(queryParams);
  await this.cacheService.set(cacheKey, result, 1800); // 30分钟
}

return result;
```

## 性能优化建议

### 1. 合理设置过期时间

- 用户会话：7天
- 产品信息：1小时
- API响应：30分钟
- 临时数据：5分钟

### 2. 使用批量操作

```typescript
// 批量获取
const keys = ['user:1', 'user:2', 'user:3'];
const users = await this.redisService.mget(keys);

// 批量设置
const userData = {
  'user:1': JSON.stringify(user1),
  'user:2': JSON.stringify(user2),
  'user:3': JSON.stringify(user3)
};
await this.redisService.mset(userData);
```

### 3. 避免缓存雪崩

```typescript
// 添加随机过期时间
const baseTtl = 3600;
const randomTtl = baseTtl + Math.floor(Math.random() * 300); // 随机增加0-5分钟
await this.cacheService.set(key, value, randomTtl);
```

## 监控和维护

### 1. 缓存统计

```typescript
const stats = await this.cacheService.getStats();
console.log('缓存统计:', stats);
```

### 2. 清理缓存

```typescript
// 清理特定模式的缓存
await this.cacheService.delPattern('user:*');

// 清理所有缓存
await this.cacheService.clear();
```

### 3. 健康检查

```typescript
// 检查Redis连接
const isConnected = await this.redisService.exists('health-check');
if (!isConnected) {
  console.error('Redis连接异常');
}
```

## 故障排除

### 1. 连接问题

- 检查Redis服务是否运行
- 验证连接配置是否正确
- 检查网络连接和防火墙设置

### 2. 内存问题

- 监控Redis内存使用情况
- 设置合理的过期时间
- 定期清理无用缓存

### 3. 性能问题

- 使用Redis监控工具分析慢查询
- 优化缓存键的设计
- 考虑使用Redis集群

## 部署注意事项

1. **开发环境**：使用本地Redis实例，无需密码
2. **测试环境**：使用独立的Redis实例，避免数据污染
3. **生产环境**：使用Redis集群，配置密码和持久化
4. **备份策略**：定期备份Redis数据
5. **监控告警**：设置Redis性能监控和告警

## 相关文档

- [Redis官方文档](https://redis.io/documentation)
- [NestJS缓存模块](https://docs.nestjs.com/techniques/caching)
- [Redis最佳实践](https://redis.io/docs/manual/patterns/)

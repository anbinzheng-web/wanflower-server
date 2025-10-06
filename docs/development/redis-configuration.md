# Redis 配置说明

## 环境变量配置

在项目根目录创建 `.env` 文件，添加以下Redis配置：

```bash
# Redis配置 - 开发环境连接本地Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

## 配置说明

### REDIS_URL
- **说明**: Redis连接URL
- **开发环境**: `redis://localhost:6379`
- **生产环境**: `redis://:password@redis-server:6379`

### REDIS_HOST
- **说明**: Redis服务器地址
- **默认值**: `localhost`

### REDIS_PORT
- **说明**: Redis服务器端口
- **默认值**: `6379`

### REDIS_PASSWORD
- **说明**: Redis密码（开发环境可为空）
- **开发环境**: 空字符串
- **生产环境**: 设置强密码

### REDIS_DB
- **说明**: Redis数据库编号
- **默认值**: `0`

## 测试配置

运行以下命令测试Redis配置：

```bash
# 简化测试（推荐）
pnpm redis:test:simple

# 完整测试（需要修复模块导入问题）
pnpm redis:test
```

## 服务使用

### 在业务服务中使用Redis

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/shared/services/redis.service';
import { CacheService } from '@/shared/services/cache.service';

@Injectable()
export class MyService {
  constructor(
    private redisService: RedisService,
    private cacheService: CacheService,
  ) {}

  async example() {
    // 基础Redis操作
    await this.redisService.set('key', 'value', 3600);
    const value = await this.redisService.get('key');

    // 高级缓存操作
    const data = await this.cacheService.getOrSet(
      'expensive-key',
      async () => await this.expensiveOperation(),
      3600
    );
  }
}
```

## 监控接口

启动应用后，可以通过以下接口监控Redis状态：

- `GET /redis/health/connection` - 检查连接状态
- `GET /redis/health/server-info` - 获取服务器信息
- `GET /redis/health/memory` - 检查内存使用
- `POST /redis/health/performance-test` - 执行性能测试
- `GET /redis/health/summary` - 获取健康状态摘要

## 故障排除

### 连接失败
1. 检查Redis服务是否运行：`redis-cli ping`
2. 检查端口是否被占用：`lsof -i :6379`
3. 检查防火墙设置

### 性能问题
1. 检查Redis内存使用：`redis-cli info memory`
2. 检查慢查询：`redis-cli slowlog get 10`
3. 调整Redis配置参数

### 数据丢失
1. 检查Redis持久化配置
2. 检查内存使用情况
3. 检查过期策略设置

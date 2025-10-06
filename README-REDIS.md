# Redis 配置说明

## 快速开始

### 1. 安装Redis

**macOS (使用Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# Redis配置 - 开发环境
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

### 3. 测试Redis连接

```bash
# 运行Redis连接测试
pnpm redis:test
```

### 4. 启动应用

```bash
# 开发模式
pnpm start:dev

# 生产模式
pnpm build
pnpm start:prod
```

## 服务说明

### RedisService
- 提供基础的Redis操作
- 支持键值对、JSON对象存储
- 支持原子性操作和批量操作

### CacheService
- 基于RedisService的高级缓存服务
- 提供业务相关的缓存方法
- 支持缓存穿透保护

### RedisHealthService
- Redis连接状态监控
- 性能测试和统计
- 内存使用情况检查

## API接口

启动应用后，可以通过以下接口监控Redis状态：

- `GET /redis/health/connection` - 检查连接状态
- `GET /redis/health/server-info` - 获取服务器信息
- `GET /redis/health/memory` - 检查内存使用
- `POST /redis/health/performance-test` - 执行性能测试
- `GET /redis/health/summary` - 获取健康状态摘要

## 使用示例

```typescript
import { RedisService, CacheService } from '@/shared/services';

@Injectable()
export class MyService {
  constructor(
    private redisService: RedisService,
    private cacheService: CacheService,
  ) {}

  async example() {
    // 基础操作
    await this.redisService.set('key', 'value', 3600);
    const value = await this.redisService.get('key');

    // 高级缓存
    const data = await this.cacheService.getOrSet(
      'expensive-key',
      async () => await this.expensiveOperation(),
      3600
    );
  }
}
```

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

## 更多信息

详细配置和使用说明请参考：
- [Redis配置指南](./docs/development/redis-setup-guide.md)
- [使用示例](./src/shared/examples/redis-usage.example.ts)

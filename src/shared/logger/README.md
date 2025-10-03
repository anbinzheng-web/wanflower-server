# 日志系统使用指南

## 概述

本项目使用基于 Pino 的高性能日志系统，提供了结构化日志记录、性能监控、业务事件跟踪等功能。

## 环境变量配置

在 `.env` 文件中配置以下环境变量：

```env
# 日志级别 (debug, info, warn, error)
LOG_LEVEL=debug

# 是否启用文件日志 (true/false)
LOG_FILE_ENABLED=false

# 日志文件目录
LOG_DIR=logs

# 运行环境 (development, production)
NODE_ENV=development
```

## 基础使用

### 1. 注入日志服务

```typescript
import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '@/shared/logger';

@Injectable()
export class YourService {
  constructor(private readonly logger: CustomLoggerService) {}
}
```

### 2. 基础日志记录

```typescript
// 信息日志
this.logger.info('用户登录成功', { userId: '123' });

// 警告日志
this.logger.warn('密码尝试次数过多', { attempts: 5 });

// 错误日志
this.logger.error('操作失败', error, { context: 'additional data' });

// 调试日志
this.logger.debug('调试信息', { debugData: 'value' });
```

### 3. 业务日志

```typescript
// 用户操作日志
this.logger.logUserAction('user_123', 'create_order', {
  orderId: 'order_456',
  amount: 99.99
});

// 业务事件日志
this.logger.logBusinessEvent({
  event: 'product_updated',
  entity: 'Product',
  entityId: 'product_123',
  oldValue: { price: 100 },
  newValue: { price: 90 },
  changes: {
    price: { from: 100, to: 90 }
  }
});

// 数据库操作日志
this.logger.logDatabaseOperation('INSERT', 'orders', 'order_456');
```

### 4. 性能监控

```typescript
// 性能日志
this.logger.logPerformance({
  operation: 'complex_calculation',
  duration: 1500,
  metrics: {
    recordsProcessed: 10000
  }
});

// 安全日志
this.logger.logSecurity('login_failed', 'user_123', '192.168.1.1', {
  reason: 'invalid_password'
});
```

## 装饰器使用

### 1. 业务操作装饰器

```typescript
import { BusinessLog } from '@/shared/logger';

@BusinessLog('create_user', '创建新用户')
async createUser(userData: any): Promise<any> {
  // 方法实现
}
```

### 2. 性能监控装饰器

```typescript
import { PerformanceLog } from '@/shared/logger';

@PerformanceLog('expensive_operation')
async expensiveOperation(): Promise<void> {
  // 耗时操作
}
```

### 3. 安全操作装饰器

```typescript
import { SecurityLog } from '@/shared/logger';

@SecurityLog('admin_operation')
async adminOperation(): Promise<void> {
  // 管理员操作
}
```

### 4. 自定义日志装饰器

```typescript
import { Log } from '@/shared/logger';

@Log({
  action: 'custom_action',
  module: 'CustomModule',
  logArgs: true,
  logResult: true,
  logDuration: true,
  level: 'info'
})
async customMethod(): Promise<void> {
  // 方法实现
}
```

## 性能监控工具

### 1. 手动性能监控

```typescript
import { PerformanceMonitor } from '@/shared/logger';

async someMethod(): Promise<void> {
  const monitor = new PerformanceMonitor('operation_name', this.logger);
  
  try {
    // 执行操作
    monitor.checkpoint('step_1_completed');
    // 更多操作
    monitor.checkpoint('step_2_completed');
  } finally {
    monitor.end({ customMetric: 123 });
  }
}
```

### 2. 装饰器性能监控

```typescript
import { performanceMonitor, dbPerformanceMonitor } from '@/shared/logger';

@performanceMonitor('data_processing')
async processData(data: any[]): Promise<any[]> {
  // 数据处理逻辑
}

@dbPerformanceMonitor('users')
async findUsers(query: any): Promise<any[]> {
  // 数据库查询逻辑
}
```

## 日志格式

### 开发环境
使用 `pino-pretty` 格式化输出，便于阅读：
```
[2024-01-01 12:00:00] INFO - 🚀 请求开始
  requestId: "req_123"
  method: "GET"
  url: "/api/users"
```

### 生产环境
使用 JSON 格式输出，便于日志收集和分析：
```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "msg": "🚀 请求开始",
  "requestId": "req_123",
  "method": "GET",
  "url": "/api/users",
  "service": "wanflower-server",
  "environment": "production"
}
```

## 日志级别

- **debug**: 调试信息，仅在开发环境显示
- **info**: 一般信息，包括请求日志、业务操作等
- **warn**: 警告信息，如慢查询、异常情况等
- **error**: 错误信息，包括异常和错误堆栈

## 最佳实践

1. **使用结构化日志**: 总是传递对象而不是字符串拼接
2. **包含上下文信息**: 添加 requestId、userId 等追踪信息
3. **敏感信息脱敏**: 密码、token 等敏感信息会被自动脱敏
4. **合理使用日志级别**: 根据信息重要性选择合适的级别
5. **性能监控**: 对关键操作使用性能监控装饰器
6. **错误处理**: 记录完整的错误堆栈和上下文信息

## 文件输出

生产环境可以启用文件输出：
- `logs/app.log`: 包含 info 级别及以上的日志
- `logs/error.log`: 仅包含 error 级别的日志

## 集成示例

查看 `src/shared/logger/examples/logger-usage.example.ts` 文件获取完整的使用示例。


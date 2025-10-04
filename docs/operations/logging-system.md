# 日志系统

## 概述

万花电商系统集成了完善的日志系统，提供结构化日志记录、性能监控、安全事件追踪等功能，支持开发和生产环境的不同配置。

## 完成的功能

### 1. 核心日志服务 ✅
- **CustomLoggerService**: 提供结构化日志记录
- **多种日志类型**: 业务日志、用户操作、数据库操作、性能监控、安全事件
- **上下文支持**: 支持 requestId、userId、module 等上下文信息

### 2. 增强的拦截器 ✅
- **LoggerInterceptor**: 增强的HTTP请求日志拦截器
  - 记录请求开始和完成
  - 错误处理和异常捕获
  - 响应时间和状态码记录
  - IP地址和User-Agent记录

- **MethodLoggerInterceptor**: 方法级别的日志拦截器
  - 支持装饰器配置
  - 参数和返回值记录（可配置）
  - 敏感信息自动脱敏

- **PerformanceInterceptor**: 性能监控拦截器
  - 内存使用监控
  - 慢请求检测
  - 性能指标记录

### 3. 异常过滤器增强 ✅
- **AllExceptionsFilter**: 集成结构化日志记录
  - 错误级别自动分类
  - 完整的错误上下文记录
  - 统一的错误响应格式

### 4. 日志装饰器 ✅
- **@Log**: 通用日志装饰器
- **@BusinessLog**: 业务操作日志
- **@PerformanceLog**: 性能监控日志
- **@SecurityLog**: 安全操作日志

### 5. 性能监控工具 ✅
- **PerformanceMonitor**: 手动性能监控类
- **@performanceMonitor**: 性能监控装饰器
- **@dbPerformanceMonitor**: 数据库操作性能监控

### 6. 高级配置 ✅
- **环境变量配置**: 支持不同环境的日志配置
- **文件输出**: 生产环境支持日志文件输出
- **日志轮转**: 分离应用日志和错误日志
- **敏感信息脱敏**: 自动过滤密码、token等敏感信息

## 文件结构

```
src/shared/logger/
├── index.ts                           # 导出所有日志功能
├── logger.service.ts                  # 核心日志服务
├── logger.module.ts                   # 日志模块配置
├── logger.interceptor.ts              # HTTP请求日志拦截器
├── README.md                          # 使用指南
├── decorators/
│   └── log.decorator.ts               # 日志装饰器
├── interceptors/
│   ├── method-logger.interceptor.ts   # 方法日志拦截器
│   └── performance.interceptor.ts     # 性能监控拦截器
├── utils/
│   └── performance-monitor.util.ts    # 性能监控工具
└── examples/
    └── logger-usage.example.ts        # 使用示例
```

## 使用示例

### 基础日志记录
```typescript
// 注入服务
constructor(private customLogger: CustomLoggerService) {}

// 记录信息
this.customLogger.info('用户登录成功', { userId: '123' });

// 记录错误
this.customLogger.error('操作失败', error, { context: 'data' });
```

### 业务日志
```typescript
// 用户操作
this.customLogger.logUserAction('user_123', 'create_order', orderData);

// 业务事件
this.customLogger.logBusinessEvent({
  event: 'product_updated',
  entity: 'Product',
  entityId: 'product_123',
  oldValue: { price: 100 },
  newValue: { price: 90 }
});
```

### 装饰器使用
```typescript
@BusinessLog('create_user', '创建新用户')
async createUser(userData: any): Promise<any> {
  // 方法实现
}

@PerformanceLog('expensive_operation')
async expensiveOperation(): Promise<void> {
  // 耗时操作
}
```

## 日志格式

### 开发环境 (Pretty格式)
```
[2024-01-01 12:00:00] INFO - 🚀 请求开始
  requestId: "req_123"
  method: "GET"
  url: "/api/users"
```

### 生产环境 (JSON格式)
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

## 环境变量配置

```env
# 日志级别
LOG_LEVEL=debug

# 文件日志
LOG_FILE_ENABLED=false
LOG_DIR=logs

# 运行环境
NODE_ENV=development
```

## 集成状态

- ✅ **AppModule**: 已集成全局拦截器和异常过滤器
- ✅ **SharedModule**: 已导出CustomLoggerService
- ✅ **UserService**: 已添加示例集成
- ✅ **全局异常处理**: 已集成结构化日志
- ✅ **性能监控**: 已集成HTTP和方法级监控

## 特色功能

1. **🚀 高性能**: 基于Pino的高性能日志库
2. **📊 结构化**: 所有日志都是结构化的JSON格式
3. **🔒 安全**: 自动脱敏敏感信息
4. **📈 监控**: 内置性能监控和慢查询检测
5. **🎯 追踪**: 支持请求ID追踪完整请求链路
6. **🌍 多环境**: 开发和生产环境不同的日志格式
7. **📁 文件输出**: 生产环境支持日志文件输出
8. **🏷️ 分类**: 支持业务、安全、性能等多种日志分类

## 日志类型说明

### 业务日志
- 用户操作记录
- 业务事件追踪
- 数据变更记录
- 业务流程监控

### 安全日志
- 登录尝试记录
- 权限变更追踪
- 异常访问记录
- 安全事件告警

### 性能日志
- 请求响应时间
- 数据库查询性能
- 内存使用情况
- 慢查询检测

### 系统日志
- 应用启动停止
- 配置变更记录
- 错误异常记录
- 系统状态监控

## 监控和告警

### 日志收集
- 支持ELK Stack集成
- 可配置日志收集器
- 支持多种输出格式
- 自动日志轮转

### 告警配置
- 错误率告警
- 性能阈值告警
- 安全事件告警
- 系统资源告警

### 监控面板
- 实时日志查看
- 性能指标展示
- 错误统计图表
- 业务指标监控

## 最佳实践

### 日志记录原则
1. **结构化**: 使用JSON格式记录日志
2. **上下文**: 包含足够的上下文信息
3. **级别**: 合理使用日志级别
4. **性能**: 避免在高频操作中记录过多日志

### 敏感信息处理
1. **自动脱敏**: 密码、token等敏感信息自动过滤
2. **配置化**: 可配置需要脱敏的字段
3. **审计**: 记录敏感操作但不记录敏感数据

### 性能优化
1. **异步记录**: 使用异步方式记录日志
2. **批量处理**: 支持批量日志处理
3. **缓存机制**: 合理使用缓存减少I/O操作

## 故障排除

### 常见问题
1. **日志文件权限**: 确保应用有写入日志文件的权限
2. **磁盘空间**: 定期清理过期日志文件
3. **性能影响**: 监控日志记录对性能的影响

### 调试步骤
1. 检查日志配置是否正确
2. 验证日志文件路径和权限
3. 查看系统资源使用情况
4. 分析日志记录的性能影响

## 下一步建议

1. **日志收集**: 可以集成ELK Stack或其他日志收集系统
2. **告警系统**: 基于错误日志设置告警
3. **监控面板**: 创建日志监控Dashboard
4. **日志分析**: 定期分析日志数据优化系统性能

日志系统已经完全集成并可以立即使用！🎉

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [开发环境搭建](../development/setup.md)
- [性能优化](./performance.md)


// src/shared/logger/index.ts

// 核心服务
export { CustomLoggerService } from './logger.service';
export { LoggerModule } from './logger.module';

// 拦截器
export { LoggerInterceptor } from './logger.interceptor';
export { MethodLoggerInterceptor } from './interceptors/method-logger.interceptor';
export { PerformanceInterceptor } from './interceptors/performance.interceptor';

// 装饰器
export {
  Log,
  BusinessLog,
  PerformanceLog,
  SecurityLog,
  LOG_METADATA_KEY,
  type LogDecoratorOptions,
} from './decorators/log.decorator';

// 工具类
export {
  PerformanceMonitor,
  performanceMonitor,
  dbPerformanceMonitor,
} from './utils/performance-monitor.util';

// 类型定义
export type {
  LogContext,
  BusinessLogData,
  PerformanceLogData,
} from './logger.service';


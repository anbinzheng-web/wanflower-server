// src/shared/logger/interceptors/performance.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly customLogger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    // 记录内存使用情况
    const startMemory = process.memoryUsage();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endMemory = process.memoryUsage();

        // 计算内存变化
        const memoryDelta = {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
        };

        // 记录性能指标
        this.customLogger.logPerformance({
          operation: `${method} ${url}`,
          duration,
          context: {
            requestId: request.id,
            module: 'HTTP',
          },
          metrics: {
            memoryDeltaRSS: memoryDelta.rss,
            memoryDeltaHeap: memoryDelta.heapUsed,
            currentHeapUsed: endMemory.heapUsed,
            currentRSS: endMemory.rss,
          },
        });

        // 如果请求时间过长，记录警告
        if (duration > 5000) {
          this.customLogger.warn(
            `慢请求检测`,
            {
              method,
              url,
              duration,
              threshold: 5000,
            },
            {
              requestId: request.id,
              module: 'Performance',
              action: 'SlowRequestDetection',
            },
          );
        }
      }),
    );
  }
}


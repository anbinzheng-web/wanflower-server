// src/shared/logger/utils/performance-monitor.util.ts
import { CustomLoggerService } from '../logger.service';

export class PerformanceMonitor {
  private startTime: number;
  private startMemory: NodeJS.MemoryUsage;
  private operation: string;
  private logger: CustomLoggerService;

  constructor(operation: string, logger: CustomLoggerService) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
  }

  /**
   * 结束监控并记录性能数据
   */
  end(additionalMetrics?: Record<string, number>): void {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - this.startTime;

    const memoryDelta = {
      rss: endMemory.rss - this.startMemory.rss,
      heapUsed: endMemory.heapUsed - this.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - this.startMemory.heapTotal,
      external: endMemory.external - this.startMemory.external,
    };

    const metrics = {
      memoryDeltaRSS: memoryDelta.rss,
      memoryDeltaHeap: memoryDelta.heapUsed,
      currentHeapUsed: endMemory.heapUsed,
      currentRSS: endMemory.rss,
      ...additionalMetrics,
    };

    this.logger.logPerformance({
      operation: this.operation,
      duration,
      metrics,
    });
  }

  /**
   * 添加检查点
   */
  checkpoint(name: string): void {
    const currentTime = Date.now();
    const currentMemory = process.memoryUsage();
    const duration = currentTime - this.startTime;

    this.logger.debug(
      `性能检查点: ${name}`,
      {
        operation: this.operation,
        checkpoint: name,
        duration,
        memoryUsage: currentMemory,
      },
    );
  }
}

/**
 * 性能监控装饰器工厂
 */
export function performanceMonitor(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const logger = this.customLogger || this.logger;
      if (!logger) {
        return method.apply(this, args);
      }

      const monitor = new PerformanceMonitor(operationName, logger);
      
      try {
        const result = await method.apply(this, args);
        monitor.end();
        return result;
      } catch (error) {
        monitor.end({ error: 1 });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 数据库操作性能监控
 */
export function dbPerformanceMonitor(tableName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = `DB.${tableName || 'unknown'}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const logger = this.customLogger || this.logger;
      if (!logger) {
        return method.apply(this, args);
      }

      const monitor = new PerformanceMonitor(operationName, logger);
      
      try {
        const result = await method.apply(this, args);
        
        // 记录数据库操作特定的指标
        const additionalMetrics: Record<string, number> = {};
        
        if (Array.isArray(result)) {
          additionalMetrics.recordCount = result.length;
        } else if (result && typeof result === 'object' && 'count' in result) {
          additionalMetrics.recordCount = result.count;
        }

        monitor.end(additionalMetrics);
        return result;
      } catch (error) {
        monitor.end({ error: 1 });
        throw error;
      }
    };

    return descriptor;
  };
}


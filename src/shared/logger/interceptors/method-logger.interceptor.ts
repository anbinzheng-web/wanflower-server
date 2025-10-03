// src/shared/logger/interceptors/method-logger.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CustomLoggerService, LogContext } from '../logger.service';
import { LOG_METADATA_KEY, LogDecoratorOptions } from '../decorators/log.decorator';

@Injectable()
export class MethodLoggerInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly customLogger: CustomLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logOptions = this.reflector.get<LogDecoratorOptions>(
      LOG_METADATA_KEY,
      context.getHandler(),
    );

    if (!logOptions) {
      return next.handle();
    }

    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const action = logOptions.action || `${className}.${methodName}`;
    
    // 获取请求上下文
    const request = context.switchToHttp().getRequest();
    const logContext: LogContext = {
      requestId: request?.id,
      userId: request?.user?.id,
      module: logOptions.module || className,
      action,
    };

    const startTime = Date.now();
    const args = context.getArgs();

    // 记录方法开始日志
    if (logOptions.logArgs) {
      this.customLogger.debug(
        `开始执行 ${action}`,
        { args: this.sanitizeArgs(args) },
        logContext,
      );
    } else {
      this.customLogger.debug(`开始执行 ${action}`, undefined, logContext);
    }

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;
        
        // 记录成功完成日志
        const logData: any = {};
        
        if (logOptions.logDuration) {
          logData.duration = duration;
        }
        
        if (logOptions.logResult && result !== undefined) {
          logData.result = this.sanitizeResult(result);
        }

        if (logOptions.description) {
          logData.description = logOptions.description;
        }

        this.customLogger[logOptions.level || 'info'](
          `完成执行 ${action}${logOptions.logDuration ? ` (${duration}ms)` : ''}`,
          logData,
          logContext,
        );

        // 如果是性能监控，记录性能日志
        if (logOptions.logDuration && duration > 100) {
          this.customLogger.logPerformance({
            operation: action,
            duration,
            context: logContext,
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // 记录错误日志
        this.customLogger.logError(
          error,
          logContext,
          {
            action,
            duration,
            args: logOptions.logArgs ? this.sanitizeArgs(args) : undefined,
          },
        );

        throw error;
      }),
    );
  }

  /**
   * 清理参数，移除敏感信息
   */
  private sanitizeArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = { ...arg };
        
        // 移除密码等敏感字段
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        sensitiveFields.forEach((field) => {
          if (sanitized[field]) {
            sanitized[field] = '***';
          }
        });
        
        return sanitized;
      }
      return arg;
    });
  }

  /**
   * 清理返回值，移除敏感信息
   */
  private sanitizeResult(result: any): any {
    if (typeof result === 'object' && result !== null) {
      const sanitized = { ...result };
      
      // 移除密码等敏感字段
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      sensitiveFields.forEach((field) => {
        if (sanitized[field]) {
          sanitized[field] = '***';
        }
      });
      
      return sanitized;
    }
    return result;
  }
}


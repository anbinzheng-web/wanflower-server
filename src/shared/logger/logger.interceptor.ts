// src/shared/logger/logger.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const requestId = req.id || this.generateRequestId();
    const start = Date.now();

    // 记录请求开始日志
    this.logger.info({
      requestId,
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    }, '🚀 请求开始');

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        
        // 记录成功响应日志
        this.logger.info({
          requestId,
          method,
          url,
          statusCode,
          duration,
          responseSize: JSON.stringify(data).length,
          timestamp: new Date().toISOString(),
        }, `✅ 请求完成 - ${statusCode} (${duration}ms)`);
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        
        // 记录错误日志
        this.logger.error({
          requestId,
          method,
          url,
          statusCode,
          duration,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          timestamp: new Date().toISOString(),
        }, `❌ 请求失败 - ${statusCode} (${duration}ms)`);

        return throwError(() => error);
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

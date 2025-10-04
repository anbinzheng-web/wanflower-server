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
    const { method, url } = req;
    const requestId = req.id || this.generateRequestId();
    const start = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        
        // 只记录慢请求
        if (duration > 3000) {
          this.logger.info({ requestId }, `⏱️ ${method} ${url} - ${statusCode} (${duration}ms)`);
        }
      }),
      catchError((error) => {
        // 不记录错误日志，完全由 AllExceptionsFilter 处理
        return throwError(() => error);
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

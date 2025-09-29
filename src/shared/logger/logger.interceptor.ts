// src/logger/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const requestId = req.id || 'unknown';
    const start = Date.now();

    this.logger.info({ requestId, method, url }, 'Request start');

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.info(
          { requestId, method, url, duration: ms },
          'Request completed',
        );
      }),
    );
  }
}

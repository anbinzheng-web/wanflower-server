import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 4000;
    let message = 'Internal server error';
    let data: any = null;

    // 获取请求信息用于日志记录
    const requestId = request.id || 'unknown';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        // 处理 class-validator 错误格式
        if (Array.isArray(r.message)) {
          message = r.message.join('; ');
        } else {
          message = r.message || r.error || message;
        }
      }
      
      // 根据 HTTP 状态码设置错误代码
      if (status >= 400 && status < 500) {
        code = status; // 客户端错误使用 HTTP 状态码
      } else if (status >= 500) {
        code = 5000; // 服务器错误
      }
    } else {
      // 非 HTTP 异常，设置服务器错误
      code = 5000;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception instanceof Error ? exception.message : 'Internal server error';
    }

    // 简化的错误日志记录
    const errorLog = {
      requestId,
      error: exception instanceof Error ? {
        name: exception.name,
        code: code,
        message: exception.message,
        stack: exception.stack,
      } : {
        name: 'Unknown',
        code: code,
        message: String(exception),
      },
      timestamp: new Date().toISOString(),
    };

    // 根据错误级别记录日志
    if (status >= 500) {
      this.logger.error(errorLog, `🔥 服务器错误 - ${status} - ${message}`);
    } else if (status >= 400) {
      this.logger.warn(errorLog, `⚠️ 客户端错误 - ${status} - ${message}`);
    } else {
      this.logger.info(errorLog, `ℹ️ 异常处理 - ${status} - ${message}`);
    }

    // 返回统一格式的错误响应
    response.status(200).json({
      code,
      data,
      message,
      requestId, // 添加请求ID便于追踪
      timestamp: new Date().toISOString(),
    });
  }
}

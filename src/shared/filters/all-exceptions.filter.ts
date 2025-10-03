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
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';

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
    }

    // 结构化错误日志记录
    const errorLog = {
      requestId,
      method,
      url,
      ip,
      userAgent,
      statusCode: status,
      errorCode: code,
      errorMessage: message,
      exception: {
        name: exception instanceof Error ? exception.name : 'Unknown',
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    // 根据错误级别记录不同级别的日志
    if (status >= 500) {
      this.logger.error(errorLog, `🔥 服务器内部错误 - ${status}`);
    } else if (status >= 400) {
      this.logger.warn(errorLog, `⚠️ 客户端错误 - ${status}`);
    } else {
      this.logger.info(errorLog, `ℹ️ 异常处理 - ${status}`);
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

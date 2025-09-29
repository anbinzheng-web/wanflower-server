import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 4000;
    // 这种就不做翻译了，因为这里的错误一般都是自己看的
    let message = 'Internal server error';
    let data: any = null;

    console.error(exception);

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

    response.status(200).json({
      code,
      data,
      message,
    });
  }
}

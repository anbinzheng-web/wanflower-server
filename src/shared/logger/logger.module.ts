// src/logger/logger.module.ts
import { Global, Module } from '@nestjs/common';
import { LoggerModule as NestLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    NestLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: true,
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        serializers: {
          req(req) {
            return {
              id: req.id,           // requestId
              method: req.method,
              url: req.url,
              headers: req.headers,
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
              message: res.statusMessage,
            };
          },
        },
      },
    }),
  ],
  exports: [NestLoggerModule],
})
export class LoggerModule {}

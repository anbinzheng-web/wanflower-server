// src/shared/logger/logger.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as NestLoggerModule } from 'nestjs-pino';
import { CustomLoggerService } from './logger.service';
import { MethodLoggerInterceptor } from './interceptors/method-logger.interceptor';
import * as path from 'path';

@Global()
@Module({
  imports: [
    NestLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const logLevel = configService.get('LOG_LEVEL') || (isProduction ? 'info' : 'debug');
        const enableFileLogging = configService.get('LOG_FILE_ENABLED') === 'true';
        const logDir = configService.get('LOG_DIR') || 'logs';

        return {
          pinoHttp: {
            level: logLevel,
            // 禁用 Pino 的默认 HTTP 日志记录，使用我们的自定义拦截器
            autoLogging: false,
            // 开发环境使用 pino-pretty，生产环境使用 JSON 格式
            transport: !isProduction
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                    levelFirst: true,
                  },
                }
              : enableFileLogging
              ? {
                  targets: [
                    {
                      target: 'pino/file',
                      options: {
                        destination: path.join(logDir, 'app.log'),
                      },
                      level: 'info',
                    },
                    {
                      target: 'pino/file',
                      options: {
                        destination: path.join(logDir, 'error.log'),
                      },
                      level: 'error',
                    },
                  ],
                }
              : undefined,
            // 自定义序列化器
            serializers: {
              req(req) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  remoteAddress: req.remoteAddress,
                  statusCode: req.statusCode,
                  headers: req.headers,
                };
              },
              res(res) {
                return {
                  statusCode: res.statusCode,
                  statusMessage: res.statusMessage,
                  headers: res.headers,
                };
              },
              err(err) {
                return {
                  type: err.constructor.name,
                  message: err.message,
                  stack: err.stack,
                  code: err.code,
                  statusCode: err.statusCode,
                };
              },
            },
            // 自定义日志格式化
            formatters: {
              level(label) {
                return { level: label };
              },
              log(object) {
                return {
                  ...object,
                  environment: process.env.NODE_ENV,
                  service: 'wanflower-server',
                  version: process.env.npm_package_version || '1.0.0',
                };
              },
            },
            // 生产环境的额外配置
            ...(isProduction && {
              redact: {
                paths: [
                  'req.headers.authorization',
                  'req.headers.cookie',
                  'req.body.password',
                  'req.body.token',
                  'res.headers["set-cookie"]',
                ],
                censor: '***REDACTED***',
              },
            }),
          },
        };
      },
    }),
  ],
  providers: [CustomLoggerService, MethodLoggerInterceptor],
  exports: [NestLoggerModule, CustomLoggerService, MethodLoggerInterceptor],
})
export class LoggerModule {}

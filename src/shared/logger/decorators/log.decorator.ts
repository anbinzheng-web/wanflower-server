// src/shared/logger/decorators/log.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const LOG_METADATA_KEY = 'log_metadata';

export interface LogDecoratorOptions {
  /** 操作名称 */
  action?: string;
  /** 模块名称 */
  module?: string;
  /** 是否记录参数 */
  logArgs?: boolean;
  /** 是否记录返回值 */
  logResult?: boolean;
  /** 是否记录执行时间 */
  logDuration?: boolean;
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** 自定义描述 */
  description?: string;
}

/**
 * 日志装饰器 - 用于自动记录方法调用日志
 */
export const Log = (options: LogDecoratorOptions = {}) => {
  return SetMetadata(LOG_METADATA_KEY, {
    action: options.action,
    module: options.module,
    logArgs: options.logArgs ?? false,
    logResult: options.logResult ?? false,
    logDuration: options.logDuration ?? true,
    level: options.level ?? 'info',
    description: options.description,
  });
};

/**
 * 业务操作日志装饰器
 */
export const BusinessLog = (action: string, description?: string) => {
  return Log({
    action,
    description,
    logArgs: true,
    logResult: true,
    logDuration: true,
    level: 'info',
  });
};

/**
 * 性能监控装饰器
 */
export const PerformanceLog = (operation: string) => {
  return Log({
    action: operation,
    logDuration: true,
    level: 'debug',
  });
};

/**
 * 安全操作日志装饰器
 */
export const SecurityLog = (action: string) => {
  return Log({
    action,
    logArgs: true,
    logResult: false,
    level: 'warn',
  });
};


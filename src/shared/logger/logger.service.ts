// src/shared/logger/logger.service.ts
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export interface LogContext {
  userId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface BusinessLogData {
  event: string;
  entity?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  changes?: Record<string, { from: any; to: any }>;
  context?: LogContext;
}

export interface PerformanceLogData {
  operation: string;
  duration: number;
  context?: LogContext;
  metrics?: Record<string, number>;
}

@Injectable()
export class CustomLoggerService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * 记录业务操作日志
   */
  logBusinessEvent(data: BusinessLogData): void {
    this.logger.info({
      type: 'business',
      event: data.event,
      entity: data.entity,
      entityId: data.entityId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      changes: data.changes,
      context: data.context,
      timestamp: new Date().toISOString(),
    }, `📊 业务事件: ${data.event}`);
  }

  /**
   * 记录用户操作日志
   */
  logUserAction(userId: string, action: string, details?: Record<string, any>): void {
    this.logger.info({
      type: 'user_action',
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    }, `👤 用户操作: ${action}`);
  }

  /**
   * 记录数据库操作日志
   */
  logDatabaseOperation(operation: string, table: string, recordId?: string, context?: LogContext): void {
    this.logger.debug({
      type: 'database',
      operation,
      table,
      recordId,
      context,
      timestamp: new Date().toISOString(),
    }, `🗄️ 数据库操作: ${operation} on ${table}`);
  }

  /**
   * 记录性能监控日志
   */
  logPerformance(data: PerformanceLogData): void {
    const level = data.duration > 5000 ? 'warn' : data.duration > 1000 ? 'info' : 'debug';
    
    this.logger[level]({
      type: 'performance',
      operation: data.operation,
      duration: data.duration,
      context: data.context,
      metrics: data.metrics,
      timestamp: new Date().toISOString(),
    }, `⚡ 性能监控: ${data.operation} (${data.duration}ms)`);
  }

  /**
   * 记录安全相关日志
   */
  logSecurity(event: string, userId?: string, ip?: string, details?: Record<string, any>): void {
    this.logger.warn({
      type: 'security',
      event,
      userId,
      ip,
      details,
      timestamp: new Date().toISOString(),
    }, `🔒 安全事件: ${event}`);
  }

  /**
   * 记录系统事件日志
   */
  logSystemEvent(event: string, level: 'info' | 'warn' | 'error' = 'info', details?: Record<string, any>): void {
    this.logger[level]({
      type: 'system',
      event,
      details,
      timestamp: new Date().toISOString(),
    }, `🔧 系统事件: ${event}`);
  }

  /**
   * 记录API调用日志
   */
  logApiCall(api: string, method: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    
    this.logger[level]({
      type: 'api_call',
      api,
      method,
      statusCode,
      duration,
      context,
      timestamp: new Date().toISOString(),
    }, `🌐 API调用: ${method} ${api} - ${statusCode} (${duration}ms)`);
  }

  /**
   * 记录错误日志（带上下文）
   */
  logError(error: Error, context?: LogContext, additionalData?: Record<string, any>): void {
    this.logger.error({
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      additionalData,
      timestamp: new Date().toISOString(),
    }, `💥 错误: ${error.message}`);
  }

  /**
   * 记录调试日志
   */
  debug(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.logger.debug({
      type: 'debug',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    }, `🐛 调试: ${message}`);
  }

  /**
   * 记录信息日志
   */
  info(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.logger.info({
      type: 'info',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    }, `ℹ️ 信息: ${message}`);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.logger.warn({
      type: 'warning',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    }, `⚠️ 警告: ${message}`);
  }

  /**
   * 记录严重错误日志
   */
  error(message: string, error?: Error, data?: Record<string, any>, context?: LogContext): void {
    this.logger.error({
      type: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      data,
      context,
      timestamp: new Date().toISOString(),
    }, `❌ 错误: ${message}`);
  }
}


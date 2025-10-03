// src/shared/logger/examples/logger-usage.example.ts
import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../logger.service';
import { BusinessLog, PerformanceLog, SecurityLog } from '../decorators/log.decorator';
import { performanceMonitor, dbPerformanceMonitor } from '../utils/performance-monitor.util';

@Injectable()
export class LoggerUsageExample {
  constructor(private readonly customLogger: CustomLoggerService) {}

  /**
   * 基础日志使用示例
   */
  basicLoggingExample(): void {
    // 信息日志
    this.customLogger.info('用户登录成功', { userId: '123', ip: '192.168.1.1' });

    // 警告日志
    this.customLogger.warn('密码尝试次数过多', { userId: '123', attempts: 5 });

    // 错误日志
    try {
      throw new Error('数据库连接失败');
    } catch (error) {
      this.customLogger.error('数据库操作失败', error, { operation: 'findUser' });
    }

    // 调试日志
    this.customLogger.debug('查询参数', { query: { page: 1, limit: 10 } });
  }

  /**
   * 业务日志使用示例
   */
  businessLoggingExample(): void {
    // 记录用户操作
    this.customLogger.logUserAction('user_123', 'create_order', {
      orderId: 'order_456',
      amount: 99.99,
      products: ['product_1', 'product_2'],
    });

    // 记录业务事件
    this.customLogger.logBusinessEvent({
      event: 'product_updated',
      entity: 'Product',
      entityId: 'product_123',
      oldValue: { price: 100, stock: 50 },
      newValue: { price: 90, stock: 45 },
      changes: {
        price: { from: 100, to: 90 },
        stock: { from: 50, to: 45 },
      },
      context: {
        userId: 'admin_123',
        module: 'ProductService',
        action: 'updateProduct',
      },
    });

    // 记录数据库操作
    this.customLogger.logDatabaseOperation('INSERT', 'orders', 'order_456', {
      userId: 'user_123',
      module: 'OrderService',
    });
  }

  /**
   * 安全日志使用示例
   */
  securityLoggingExample(): void {
    // 记录安全事件
    this.customLogger.logSecurity('login_failed', 'user_123', '192.168.1.100', {
      reason: 'invalid_password',
      attempts: 3,
    });

    this.customLogger.logSecurity('suspicious_activity', 'user_456', '10.0.0.1', {
      action: 'bulk_download',
      fileCount: 1000,
    });
  }

  /**
   * 性能监控使用示例
   */
  performanceLoggingExample(): void {
    // 记录性能数据
    this.customLogger.logPerformance({
      operation: 'complex_calculation',
      duration: 1500,
      context: {
        module: 'AnalyticsService',
        action: 'generateReport',
      },
      metrics: {
        recordsProcessed: 10000,
        memoryUsed: 256 * 1024 * 1024, // 256MB
      },
    });
  }

  /**
   * 使用装饰器的业务方法示例
   */
  @BusinessLog('create_user', '创建新用户')
  async createUser(userData: any): Promise<any> {
    // 模拟创建用户逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: 'user_' + Date.now(),
      ...userData,
    };
  }

  /**
   * 使用性能监控装饰器的方法示例
   */
  @PerformanceLog('expensive_operation')
  async expensiveOperation(): Promise<void> {
    // 模拟耗时操作
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * 使用安全日志装饰器的方法示例
   */
  @SecurityLog('admin_operation')
  async adminOperation(adminId: string, action: string): Promise<void> {
    // 模拟管理员操作
    this.customLogger.info('管理员操作执行', { adminId, action });
  }

  /**
   * 使用性能监控工具的方法示例
   */
  @performanceMonitor('data_processing')
  async processLargeDataset(data: any[]): Promise<any[]> {
    // 模拟大数据处理
    const results: any[] = [];
    for (let i = 0; i < data.length; i++) {
      // 模拟处理逻辑
      results.push({ ...data[i], processed: true });
      
      // 每处理1000条记录记录一个检查点
      if (i % 1000 === 0) {
        // 注意：这里需要手动获取 monitor 实例，实际使用中可以通过其他方式
        this.customLogger.debug(`处理进度检查点`, { processed: i, total: data.length });
      }
    }
    return results;
  }

  /**
   * 使用数据库性能监控装饰器的方法示例
   */
  @dbPerformanceMonitor('users')
  async findUsers(query: any): Promise<any[]> {
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ];
  }

  /**
   * 复合日志使用示例 - 完整的业务流程日志
   */
  async completeBusinessFlowExample(userId: string, orderData: any): Promise<any> {
    const context = {
      userId,
      requestId: 'req_' + Date.now(),
      module: 'OrderService',
      action: 'createOrder',
    };

    try {
      // 1. 记录业务流程开始
      this.customLogger.info('订单创建流程开始', { orderData }, context);

      // 2. 记录用户操作
      this.customLogger.logUserAction(userId, 'initiate_order', orderData);

      // 3. 模拟验证步骤
      this.customLogger.debug('验证订单数据', { validation: 'passed' }, context);

      // 4. 模拟数据库操作
      this.customLogger.logDatabaseOperation('INSERT', 'orders', 'order_789', context);

      // 5. 记录业务事件
      this.customLogger.logBusinessEvent({
        event: 'order_created',
        entity: 'Order',
        entityId: 'order_789',
        newValue: orderData,
        context,
      });

      // 6. 记录成功完成
      this.customLogger.info('订单创建成功', { orderId: 'order_789' }, context);

      return { success: true, orderId: 'order_789' };

    } catch (error) {
      // 记录错误
      this.customLogger.logError(error, context, { orderData });
      throw error;
    }
  }
}


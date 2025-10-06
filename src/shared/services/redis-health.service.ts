import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis健康检查服务
 * 提供Redis连接状态监控和健康检查功能
 */
@Injectable()
export class RedisHealthService {
  constructor(private redisService: RedisService) {}

  /**
   * 检查Redis连接状态
   * @returns 连接状态信息
   */
  async checkConnection(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      // 尝试执行PING命令
      const startTime = Date.now();
      const pong = await this.redisService.getClient().ping();
      const responseTime = Date.now() - startTime;

      if (pong === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis连接正常',
          details: {
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis响应异常',
          details: {
            response: pong,
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis连接失败',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * 获取Redis服务器信息
   * @returns Redis服务器信息
   */
  async getServerInfo(): Promise<{
    version?: string;
    uptime?: string;
    memory?: string;
    connectedClients?: string;
    usedMemory?: string;
    totalKeys?: number;
  }> {
    try {
      const info = await this.redisService.info();
      const lines = info.split('\r\n');
      
      const serverInfo: any = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          switch (key) {
            case 'redis_version':
              serverInfo.version = value;
              break;
            case 'uptime_in_seconds':
              serverInfo.uptime = `${Math.floor(parseInt(value) / 3600)}小时`;
              break;
            case 'used_memory_human':
              serverInfo.memory = value;
              break;
            case 'connected_clients':
              serverInfo.connectedClients = value;
              break;
            case 'used_memory':
              serverInfo.usedMemory = `${Math.floor(parseInt(value) / 1024 / 1024)}MB`;
              break;
          }
        }
      }

      // 获取键数量
      try {
        serverInfo.totalKeys = await this.redisService.dbsize();
      } catch (error) {
        serverInfo.totalKeys = 'unknown';
      }

      return serverInfo;
    } catch (error) {
      return {
        version: 'unknown',
        uptime: 'unknown',
        memory: 'unknown',
        connectedClients: 'unknown',
        usedMemory: 'unknown',
        totalKeys: 0,
      };
    }
  }

  /**
   * 执行Redis性能测试
   * @param iterations 测试次数，默认1000
   * @returns 性能测试结果
   */
  async performanceTest(iterations: number = 1000): Promise<{
    totalTime: number;
    averageTime: number;
    operationsPerSecond: number;
    successRate: number;
  }> {
    const startTime = Date.now();
    let successCount = 0;
    const testKey = 'performance-test';

    try {
      // 执行写入测试
      for (let i = 0; i < iterations; i++) {
        try {
          await this.redisService.set(`${testKey}:${i}`, `value-${i}`);
          successCount++;
        } catch (error) {
          // 忽略单个操作的错误
        }
      }

      // 执行读取测试
      for (let i = 0; i < iterations; i++) {
        try {
          await this.redisService.get(`${testKey}:${i}`);
          successCount++;
        } catch (error) {
          // 忽略单个操作的错误
        }
      }

      const totalTime = Date.now() - startTime;
      const totalOperations = iterations * 2; // 写入 + 读取
      const averageTime = totalTime / totalOperations;
      const operationsPerSecond = Math.round((totalOperations / totalTime) * 1000);
      const successRate = (successCount / totalOperations) * 100;

      // 清理测试数据
      try {
        const keys = await this.redisService.keys(`${testKey}:*`);
        if (keys.length > 0) {
          for (const key of keys) {
            await this.redisService.del(key);
          }
        }
      } catch (error) {
        // 忽略清理错误
      }

      return {
        totalTime,
        averageTime: Math.round(averageTime * 100) / 100,
        operationsPerSecond,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      return {
        totalTime: 0,
        averageTime: 0,
        operationsPerSecond: 0,
        successRate: 0,
      };
    }
  }

  /**
   * 检查Redis内存使用情况
   * @returns 内存使用信息
   */
  async checkMemoryUsage(): Promise<{
    usedMemory: string;
    usedMemoryPercentage: number;
    maxMemory: string;
    memoryFragmentationRatio: number;
  }> {
    try {
      const info = await this.redisService.info();
      const lines = info.split('\r\n');
      
      let usedMemory = 0;
      let maxMemory = 0;
      let memoryFragmentationRatio = 0;

      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          switch (key) {
            case 'used_memory':
              usedMemory = parseInt(value);
              break;
            case 'maxmemory':
              maxMemory = parseInt(value);
              break;
            case 'mem_fragmentation_ratio':
              memoryFragmentationRatio = parseFloat(value);
              break;
          }
        }
      }

      const usedMemoryMB = Math.round(usedMemory / 1024 / 1024);
      const maxMemoryMB = maxMemory > 0 ? Math.round(maxMemory / 1024 / 1024) : 0;
      const usedMemoryPercentage = maxMemory > 0 ? Math.round((usedMemory / maxMemory) * 100) : 0;

      return {
        usedMemory: `${usedMemoryMB}MB`,
        usedMemoryPercentage,
        maxMemory: maxMemoryMB > 0 ? `${maxMemoryMB}MB` : 'unlimited',
        memoryFragmentationRatio: Math.round(memoryFragmentationRatio * 100) / 100,
      };
    } catch (error) {
      return {
        usedMemory: 'unknown',
        usedMemoryPercentage: 0,
        maxMemory: 'unknown',
        memoryFragmentationRatio: 0,
      };
    }
  }

  /**
   * 获取Redis健康状态摘要
   * @returns 健康状态摘要
   */
  async getHealthSummary(): Promise<{
    connection: any;
    serverInfo: any;
    memoryUsage: any;
    performance?: any;
  }> {
    const [connection, serverInfo, memoryUsage] = await Promise.all([
      this.checkConnection(),
      this.getServerInfo(),
      this.checkMemoryUsage(),
    ]);

    return {
      connection,
      serverInfo,
      memoryUsage,
    };
  }
}

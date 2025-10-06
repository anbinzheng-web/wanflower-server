import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisHealthService } from '../services/redis-health.service';

/**
 * Redis健康检查控制器
 * 提供Redis连接状态监控和性能测试接口
 */
@ApiTags('Redis健康检查')
@Controller('redis/health')
export class RedisHealthController {
  constructor(private redisHealthService: RedisHealthService) {}

  /**
   * 检查Redis连接状态
   */
  @Get('connection')
  @ApiOperation({ summary: '检查Redis连接状态' })
  @ApiResponse({ status: 200, description: '连接状态检查成功' })
  async checkConnection() {
    return await this.redisHealthService.checkConnection();
  }

  /**
   * 获取Redis服务器信息
   */
  @Get('server-info')
  @ApiOperation({ summary: '获取Redis服务器信息' })
  @ApiResponse({ status: 200, description: '服务器信息获取成功' })
  async getServerInfo() {
    return await this.redisHealthService.getServerInfo();
  }

  /**
   * 检查Redis内存使用情况
   */
  @Get('memory')
  @ApiOperation({ summary: '检查Redis内存使用情况' })
  @ApiResponse({ status: 200, description: '内存使用情况获取成功' })
  async checkMemoryUsage() {
    return await this.redisHealthService.checkMemoryUsage();
  }

  /**
   * 执行Redis性能测试
   */
  @Post('performance-test')
  @ApiOperation({ summary: '执行Redis性能测试' })
  @ApiResponse({ status: 200, description: '性能测试完成' })
  async performanceTest() {
    return await this.redisHealthService.performanceTest(1000);
  }

  /**
   * 获取Redis健康状态摘要
   */
  @Get('summary')
  @ApiOperation({ summary: '获取Redis健康状态摘要' })
  @ApiResponse({ status: 200, description: '健康状态摘要获取成功' })
  async getHealthSummary() {
    return await this.redisHealthService.getHealthSummary();
  }
}

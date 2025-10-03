import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from '../logger/logger.service';

/**
 * 登录尝试记录服务
 * 负责记录登录尝试，防止暴力破解攻击
 */
@Injectable()
export class LoginAttemptService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  /**
   * 记录登录尝试
   * @param email 邮箱地址
   * @param ipAddress IP地址
   * @param userAgent 用户代理
   * @param success 是否成功
   * @param reason 失败原因
   */
  async recordLoginAttempt(
    email: string | null,
    ipAddress: string,
    userAgent: string | null,
    success: boolean,
    reason?: string
  ): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          success,
          reason,
        },
      });

      this.logger.info('记录登录尝试', { 
        email, 
        ipAddress, 
        success, 
        reason 
      }, {
        module: 'LoginAttemptService',
        action: 'recordLoginAttempt',
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'recordLoginAttempt',
      }, { email, ipAddress, success });
      throw error;
    }
  }

  /**
   * 检查IP是否被限制
   * @param ipAddress IP地址
   * @returns 是否被限制
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 检查最近1小时内失败的登录尝试次数
      const failedAttempts = await this.prisma.loginAttempt.count({
        where: {
          ip_address: ipAddress,
          success: false,
          created_at: { gte: oneHourAgo },
        },
      });

      // 如果1小时内失败次数超过10次，则限制该IP
      const isBlocked = failedAttempts >= 10;

      if (isBlocked) {
        this.logger.warn('IP被限制', { ipAddress, failedAttempts }, {
          module: 'LoginAttemptService',
          action: 'isIpBlocked',
        });
      }

      return isBlocked;
    } catch (error) {
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'isIpBlocked',
      }, { ipAddress });
      return false;
    }
  }

  /**
   * 检查邮箱是否被限制
   * @param email 邮箱地址
   * @returns 是否被限制
   */
  async isEmailBlocked(email: string): Promise<boolean> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 检查最近1小时内该邮箱的失败登录尝试次数
      const failedAttempts = await this.prisma.loginAttempt.count({
        where: {
          email,
          success: false,
          created_at: { gte: oneHourAgo },
        },
      });

      // 如果1小时内失败次数超过5次，则限制该邮箱
      const isBlocked = failedAttempts >= 5;

      if (isBlocked) {
        this.logger.warn('邮箱被限制', { email, failedAttempts }, {
          module: 'LoginAttemptService',
          action: 'isEmailBlocked',
        });
      }

      return isBlocked;
    } catch (error) {
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'isEmailBlocked',
      }, { email });
      return false;
    }
  }

  /**
   * 检查是否可以尝试登录
   * @param email 邮箱地址
   * @param ipAddress IP地址
   * @throws TooManyRequestsException 如果被限制
   */
  async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
    try {
      // 检查IP限制
      if (await this.isIpBlocked(ipAddress)) {
        throw new HttpException('IP地址被限制，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
      }

      // 检查邮箱限制
      if (await this.isEmailBlocked(email)) {
        throw new HttpException('该邮箱登录尝试过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'checkLoginAttempts',
      }, { email, ipAddress });
      throw error;
    }
  }

  /**
   * 清理过期的登录尝试记录
   * @param daysToKeep 保留天数，默认7天
   */
  async cleanExpiredAttempts(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const deletedCount = await this.prisma.loginAttempt.deleteMany({
        where: {
          created_at: { lt: cutoffDate },
        },
      });

      if (deletedCount.count > 0) {
        this.logger.info('清理过期登录尝试记录', { 
          deletedCount: deletedCount.count,
          cutoffDate 
        }, {
          module: 'LoginAttemptService',
          action: 'cleanExpiredAttempts',
        });
      }
    } catch (error) {
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'cleanExpiredAttempts',
      });
      throw error;
    }
  }

  /**
   * 获取登录统计信息
   * @param email 邮箱地址（可选）
   * @param ipAddress IP地址（可选）
   * @param hours 统计时间范围（小时）
   * @returns 登录统计信息
   */
  async getLoginStats(
    email?: string,
    ipAddress?: string,
    hours: number = 24
  ): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const whereClause: any = {
        created_at: { gte: since },
      };

      if (email) {
        whereClause.email = email;
      }

      if (ipAddress) {
        whereClause.ip_address = ipAddress;
      }

      const totalAttempts = await this.prisma.loginAttempt.count({
        where: whereClause,
      });

      const successfulAttempts = await this.prisma.loginAttempt.count({
        where: { ...whereClause, success: true },
      });

      const failedAttempts = totalAttempts - successfulAttempts;
      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'LoginAttemptService',
        action: 'getLoginStats',
      }, { email, ipAddress, hours });
      throw error;
    }
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
// import { VerificationType } from '@prisma/client';

/**
 * 邮箱验证服务
 * 负责生成、验证和管理邮箱验证码
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  /**
   * 生成邮箱验证码
   * @param email 邮箱地址
   * @param type 验证类型
   * @returns 验证码
   */
  async generateVerificationCode(email: string, type: string): Promise<string> {
    try {
      // 清理过期的验证码
      await this.cleanExpiredCodes(email);

      // 检查是否已有未使用的验证码
      const existingCode = await this.prisma.emailVerification.findFirst({
        where: {
          email,
          type: type as any,
          is_used: false,
          expires_at: { gt: new Date() },
        },
      });

      if (existingCode) {
        // 如果验证码还在有效期内，返回现有验证码
        this.logger.info('使用现有验证码', { email, type }, {
          module: 'EmailVerificationService',
          action: 'generateVerificationCode',
        });
        return existingCode.code;
      }

      // 生成6位数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到数据库
      await this.prisma.emailVerification.create({
        data: {
          email,
          code,
          type: type as any,
          expires_at: expiresAt,
        },
      });

      this.logger.info('生成邮箱验证码', { email, type, expiresAt }, {
        module: 'EmailVerificationService',
        action: 'generateVerificationCode',
      });

      // TODO: 这里应该发送邮件，暂时只记录日志
      this.logger.info('发送验证码邮件', { email, code }, {
        module: 'EmailVerificationService',
        action: 'sendVerificationEmail',
      });

      return code;
    } catch (error) {
      this.logger.logError(error, {
        module: 'EmailVerificationService',
        action: 'generateVerificationCode',
      }, { email, type });
      throw error;
    }
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱地址
   * @param code 验证码
   * @param type 验证类型
   * @returns 是否验证成功
   */
  async verifyCode(email: string, code: string, type: string): Promise<boolean> {
    try {
      const verification = await this.prisma.emailVerification.findFirst({
        where: {
          email,
          code,
          type: type as any,
          is_used: false,
          expires_at: { gt: new Date() },
        },
      });

      if (!verification) {
        this.logger.warn('验证码验证失败', { email, type }, {
          module: 'EmailVerificationService',
          action: 'verifyCode',
        });
        return false;
      }

      // 标记验证码为已使用
      await this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: { is_used: true },
      });

      this.logger.info('验证码验证成功', { email, type }, {
        module: 'EmailVerificationService',
        action: 'verifyCode',
      });

      return true;
    } catch (error) {
      this.logger.logError(error, {
        module: 'EmailVerificationService',
        action: 'verifyCode',
      }, { email, type });
      throw error;
    }
  }

  /**
   * 清理过期的验证码
   * @param email 邮箱地址（可选，不传则清理所有过期验证码）
   */
  async cleanExpiredCodes(email?: string): Promise<void> {
    try {
      const whereClause = {
        expires_at: { lt: new Date() },
        ...(email && { email }),
      };

      const deletedCount = await this.prisma.emailVerification.deleteMany({
        where: whereClause,
      });

      if (deletedCount.count > 0) {
        this.logger.info('清理过期验证码', { 
          deletedCount: deletedCount.count,
          email: email || 'all' 
        }, {
          module: 'EmailVerificationService',
          action: 'cleanExpiredCodes',
        });
      }
    } catch (error) {
      this.logger.logError(error, {
        module: 'EmailVerificationService',
        action: 'cleanExpiredCodes',
      }, { email });
      throw error;
    }
  }

  /**
   * 检查邮箱验证码发送频率限制
   * @param email 邮箱地址
   * @returns 是否可以发送验证码
   */
  async canSendCode(email: string): Promise<boolean> {
    try {
      // 检查最近1分钟内是否已发送过验证码
      const recentCode = await this.prisma.emailVerification.findFirst({
        where: {
          email,
          created_at: { gte: new Date(Date.now() - 60 * 1000) }, // 1分钟内
        },
        orderBy: { created_at: 'desc' },
      });

      if (recentCode) {
        this.logger.warn('验证码发送过于频繁', { email }, {
          module: 'EmailVerificationService',
          action: 'canSendCode',
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.logError(error, {
        module: 'EmailVerificationService',
        action: 'canSendCode',
      }, { email });
      throw error;
    }
  }
}

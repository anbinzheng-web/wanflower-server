import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { RefreshToken } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Refresh Token服务
 * 负责管理Refresh Token的生成、验证和撤销
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  /**
   * 生成Refresh Token
   * @param userId 用户ID
   * @param deviceId 设备ID（可选）
   * @returns Refresh Token记录
   */
  async generateRefreshToken(userId: number, deviceId?: string): Promise<RefreshToken> {
    try {
      // 生成安全的随机token
      const token = crypto.randomBytes(64).toString('hex');
      
      // 设置过期时间（7天）
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // 如果提供了设备ID，先撤销该设备的所有现有token
      if (deviceId) {
        await this.revokeTokensByDevice(userId, deviceId);
      }

      // 创建新的Refresh Token
      const refreshToken = await this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          device_id: deviceId,
          token,
          expires_at: expiresAt,
        },
      });

      this.logger.info('生成Refresh Token', { 
        userId, 
        deviceId,
        expiresAt 
      }, {
        module: 'RefreshTokenService',
        action: 'generateRefreshToken',
      });

      return refreshToken;
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'generateRefreshToken',
      }, { userId, deviceId });
      throw error;
    }
  }

  /**
   * 验证Refresh Token
   * @param token Refresh Token
   * @returns Refresh Token记录和用户信息
   */
  async validateRefreshToken(token: string): Promise<RefreshToken & { user: any }> {
    try {
      const refreshToken = await this.prisma.refreshToken.findFirst({
        where: {
          token,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
      });

      if (!refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: refreshToken.user_id },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true,
        },
      });

      if (!user) {
        this.logger.warn('用户不存在', { userId: refreshToken.user_id }, {
          module: 'RefreshTokenService',
          action: 'validateRefreshToken',
        });
        throw new UnauthorizedException('User not found');
      }

      // 检查用户是否仍然活跃
      if (!user.is_active) {
        this.logger.warn('用户账户已被禁用', { 
          userId: refreshToken.user_id 
        }, {
          module: 'RefreshTokenService',
          action: 'validateRefreshToken',
        });
        throw new UnauthorizedException('User account is disabled');
      }

      this.logger.info('Refresh Token验证成功', { 
        userId: refreshToken.user_id,
        deviceId: refreshToken.device_id 
      }, {
        module: 'RefreshTokenService',
        action: 'validateRefreshToken',
      });

      // 返回包含用户信息的RefreshToken对象
      return {
        ...refreshToken,
        user: user as any,
      } as RefreshToken & { user: any };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'validateRefreshToken',
      }, { token });
      throw error;
    }
  }

  /**
   * 撤销Refresh Token
   * @param token Refresh Token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { token },
        data: { is_revoked: true },
      });

      this.logger.info('撤销Refresh Token', { token }, {
        module: 'RefreshTokenService',
        action: 'revokeRefreshToken',
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'revokeRefreshToken',
      }, { token });
      throw error;
    }
  }

  /**
   * 撤销用户的所有Refresh Token
   * @param userId 用户ID
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: { 
          user_id: userId,
          is_revoked: false,
        },
        data: { is_revoked: true },
      });

      this.logger.info('撤销用户所有Refresh Token', { 
        userId, 
        revokedCount: result.count 
      }, {
        module: 'RefreshTokenService',
        action: 'revokeAllUserTokens',
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'revokeAllUserTokens',
      }, { userId });
      throw error;
    }
  }

  /**
   * 撤销指定设备的所有Refresh Token
   * @param userId 用户ID
   * @param deviceId 设备ID
   */
  async revokeTokensByDevice(userId: number, deviceId: string): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: { 
          user_id: userId,
          device_id: deviceId,
          is_revoked: false,
        },
        data: { is_revoked: true },
      });

      if (result.count > 0) {
        this.logger.info('撤销设备所有Refresh Token', { 
          userId, 
          deviceId,
          revokedCount: result.count 
        }, {
          module: 'RefreshTokenService',
          action: 'revokeTokensByDevice',
        });
      }
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'revokeTokensByDevice',
      }, { userId, deviceId });
      throw error;
    }
  }

  /**
   * 清理过期的Refresh Token
   */
  async cleanExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expires_at: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        this.logger.info('清理过期Refresh Token', { 
          deletedCount: result.count 
        }, {
          module: 'RefreshTokenService',
          action: 'cleanExpiredTokens',
        });
      }
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'cleanExpiredTokens',
      });
      throw error;
    }
  }

  /**
   * 获取用户的活跃Refresh Token列表
   * @param userId 用户ID
   * @returns Refresh Token列表
   */
  async getUserActiveTokens(userId: number): Promise<RefreshToken[]> {
    try {
      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          user_id: userId,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      this.logger.info('获取用户活跃Refresh Token', { 
        userId, 
        tokenCount: tokens.length 
      }, {
        module: 'RefreshTokenService',
        action: 'getUserActiveTokens',
      });

      return tokens;
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'getUserActiveTokens',
      }, { userId });
      throw error;
    }
  }

  /**
   * 检查用户是否有过多的活跃Token
   * @param userId 用户ID
   * @param maxTokens 最大Token数量，默认5个
   * @returns 是否需要清理
   */
  async shouldCleanupUserTokens(userId: number, maxTokens: number = 5): Promise<boolean> {
    try {
      const activeTokens = await this.getUserActiveTokens(userId);
      return activeTokens.length > maxTokens;
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'shouldCleanupUserTokens',
      }, { userId, maxTokens });
      return false;
    }
  }

  /**
   * 清理用户多余的Token，保留最新的几个
   * @param userId 用户ID
   * @param keepCount 保留数量，默认3个
   */
  async cleanupUserTokens(userId: number, keepCount: number = 3): Promise<void> {
    try {
      const activeTokens = await this.getUserActiveTokens(userId);
      
      if (activeTokens.length <= keepCount) {
        return;
      }

      // 按创建时间排序，保留最新的几个
      const tokensToRevoke = activeTokens.slice(keepCount);
      
      for (const token of tokensToRevoke) {
        await this.revokeRefreshToken(token.token);
      }

      this.logger.info('清理用户多余Token', { 
        userId, 
        revokedCount: tokensToRevoke.length,
        keptCount: keepCount 
      }, {
        module: 'RefreshTokenService',
        action: 'cleanupUserTokens',
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'RefreshTokenService',
        action: 'cleanupUserTokens',
      }, { userId, keepCount });
      throw error;
    }
  }
}

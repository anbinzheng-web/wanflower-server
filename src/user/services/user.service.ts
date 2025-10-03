import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { CustomLoggerService } from 'shared/logger/logger.service';
import { PasswordService } from 'shared/services/password.service';
import { BusinessLog, SecurityLog } from 'shared/logger/decorators/log.decorator';
import { dbPerformanceMonitor } from 'shared/logger/utils/performance-monitor.util';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
    private passwordService: PasswordService,
  ) {}

  @dbPerformanceMonitor('users')
  async findByEmail(email: string) {
    this.customLogger.logDatabaseOperation('SELECT', 'users', undefined, {
      module: 'UserService',
      action: 'findByEmail',
    });
    return this.prisma.user.findUnique({ where: { email } });
  }

  @dbPerformanceMonitor('users')
  async findById(id: number) {
    this.customLogger.logDatabaseOperation('SELECT', 'users', id.toString(), {
      module: 'UserService',
      action: 'findById',
    });
    return this.prisma.user.findUnique({ where: { id } });
  }

  @BusinessLog('create_user', '创建新用户')
  async createUser(email: string, password: string) {
    try {
      const existing = await this.findByEmail(email);
      if (existing) {
        this.customLogger.warn('尝试创建已存在的用户', { email }, {
          module: 'UserService',
          action: 'createUser',
        });
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await this.passwordService.hashPassword(password);
      const user = await this.prisma.user.create({
        data: { email, password: hashedPassword },
      });

      // 记录用户创建事件
      this.customLogger.logBusinessEvent({
        event: 'user_created',
        entity: 'User',
        entityId: user.id.toString(),
        newValue: { email: user.email, role: user.role },
        context: {
          module: 'UserService',
          action: 'createUser',
        },
      });

      this.customLogger.info('用户创建成功', { 
        userId: user.id, 
        email: user.email 
      }, {
        module: 'UserService',
        action: 'createUser',
      });

      return user;
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'UserService',
        action: 'createUser',
      }, { email });
      throw error;
    }
  }

  @SecurityLog('set_user_role')
  async setRole(userId: number, role: 'user' | 'staff' | 'admin') {
    try {
      const oldUser = await this.findById(userId);
      if (!oldUser) {
        throw new BadRequestException('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      // 记录角色变更事件
      this.customLogger.logBusinessEvent({
        event: 'user_role_changed',
        entity: 'User',
        entityId: userId.toString(),
        oldValue: { role: oldUser.role },
        newValue: { role: updatedUser.role },
        changes: {
          role: { from: oldUser.role, to: updatedUser.role },
        },
        context: {
          module: 'UserService',
          action: 'setRole',
        },
      });

      // 记录安全相关的角色变更
      this.customLogger.logSecurity('role_changed', userId.toString(), undefined, {
        oldRole: oldUser.role,
        newRole: updatedUser.role,
      });

      return updatedUser;
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'UserService',
        action: 'setRole',
      }, { userId, role });
      throw error;
    }
  }

  /**
   * 更新用户密码
   * @param userId 用户ID
   * @param hashedPassword 已加密的新密码
   */
  @SecurityLog('update_password')
  async updatePassword(userId: number, hashedPassword: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // 记录密码更新事件（不记录密码内容）
      this.customLogger.logSecurity('password_updated', userId.toString(), undefined, {
        timestamp: new Date().toISOString(),
      });

      this.customLogger.info('用户密码已更新', { userId }, {
        module: 'UserService',
        action: 'updatePassword',
      });

      return updatedUser;
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'UserService',
        action: 'updatePassword',
      }, { userId });
      throw error;
    }
  }

  /**
   * 更新用户最后登录时间
   * @param userId 用户ID
   */
  async updateLastLogin(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { 
          last_login: new Date(),
          login_count: { increment: 1 },
        },
      });

      this.customLogger.info('更新用户登录时间', { userId }, {
        module: 'UserService',
        action: 'updateLastLogin',
      });
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'UserService',
        action: 'updateLastLogin',
      }, { userId });
      throw error;
    }
  }

  /**
   * 验证用户邮箱
   * @param userId 用户ID
   */
  async verifyUserEmail(userId: number) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { is_verified: true },
      });

      this.customLogger.info('用户邮箱已验证', { userId }, {
        module: 'UserService',
        action: 'verifyUserEmail',
      });

      return updatedUser;
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'UserService',
        action: 'verifyUserEmail',
      }, { userId });
      throw error;
    }
  }
}

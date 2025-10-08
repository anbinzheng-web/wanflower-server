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

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户最后活跃时间（包括登录和refresh token）
   * @param userId 用户ID
   */
  async updateLastActivity(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { 
          last_login: new Date(),
        },
      });
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * 获取用户列表（分页、筛选、搜索）
   * @param query 查询参数
   * @returns 用户列表和分页信息
   */
  async getUsers(query: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    is_verified?: boolean;
    is_active?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        page = 1,
        page_size = 10,
        search,
        role,
        is_verified,
        is_active,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * page_size;

      // 构建查询条件
      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (typeof is_verified === 'boolean') {
        where.is_verified = is_verified;
      }

      if (typeof is_active === 'boolean') {
        where.is_active = is_active;
      }

      // 执行查询
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: page_size,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            role: true,
            first_name: true,
            last_name: true,
            phone: true,
            avatar_url: true,
            is_verified: true,
            is_active: true,
            last_login: true,
            created_at: true,
            updated_at: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / page_size);

      return {
        records: users,
        total,
        page,
        page_size,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取用户详情
   * @param id 用户ID
   * @returns 用户详情
   */
  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          birth_date: true,
          gender: true,
          is_verified: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
          addresses: {
            select: {
              id: true,
              name: true,
              phone: true,
              country: true,
              province: true,
              city: true,
              district: true,
              address_line: true,
              postal_code: true,
              is_default: true,
            },
          },
        },
      });

      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建用户（管理员功能）
   * @param userData 用户数据
   * @returns 创建的用户
   */
  async createUserByAdmin(userData: {
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    is_verified?: boolean;
    is_active?: boolean;
  }) {
    try {
      // 检查邮箱是否已存在
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException('邮箱已存在');
      }

      // 加密密码
      const hashedPassword = await this.passwordService.hashPassword(userData.password);

      // 创建用户
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role as any,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          avatar_url: userData.avatar_url,
          is_verified: userData.is_verified ?? false,
          is_active: userData.is_active ?? true,
        },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          is_verified: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.customLogger.logBusinessEvent({
        event: 'user_created_by_admin',
        entity: 'User',
        entityId: user.id.toString(),
        newValue: { email: user.email, role: user.role },
        context: {
          module: 'UserService',
          action: 'createUserByAdmin',
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户信息（管理员功能）
   * @param id 用户ID
   * @param userData 更新数据
   * @returns 更新后的用户
   */
  async updateUserByAdmin(id: number, userData: {
    email?: string;
    password?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    is_verified?: boolean;
    is_active?: boolean;
  }) {
    try {
      // 检查用户是否存在
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new BadRequestException('用户不存在');
      }

      // 如果更新邮箱，检查新邮箱是否已存在
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.findByEmail(userData.email);
        if (emailExists) {
          throw new BadRequestException('邮箱已存在');
        }
      }

      // 准备更新数据
      const updateData: any = { ...userData };

      // 如果更新密码，需要加密
      if (userData.password) {
        updateData.password = await this.passwordService.hashPassword(userData.password);
      }

      // 更新用户
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          is_verified: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.customLogger.logBusinessEvent({
        event: 'user_updated_by_admin',
        entity: 'User',
        entityId: id.toString(),
        oldValue: { 
          email: existingUser.email, 
          role: existingUser.role,
          is_active: existingUser.is_active,
          is_verified: existingUser.is_verified,
        },
        newValue: { 
          email: updatedUser.email, 
          role: updatedUser.role,
          is_active: updatedUser.is_active,
          is_verified: updatedUser.is_verified,
        },
        context: {
          module: 'UserService',
          action: 'updateUserByAdmin',
        },
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除用户（管理员功能）
   * @param id 用户ID
   */
  async deleteUserByAdmin(id: number) {
    try {
      // 检查用户是否存在
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new BadRequestException('用户不存在');
      }

      // 删除用户（级联删除相关数据）
      await this.prisma.user.delete({
        where: { id },
      });

      this.customLogger.logBusinessEvent({
        event: 'user_deleted_by_admin',
        entity: 'User',
        entityId: id.toString(),
        oldValue: { 
          email: existingUser.email, 
          role: existingUser.role 
        },
        context: {
          module: 'UserService',
          action: 'deleteUserByAdmin',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户状态（激活/禁用）
   * @param id 用户ID
   * @param isActive 是否激活
   * @returns 更新后的用户
   */
  async updateUserStatus(id: number, isActive: boolean) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { is_active: isActive },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true,
        },
      });

      this.customLogger.logBusinessEvent({
        event: 'user_status_updated',
        entity: 'User',
        entityId: id.toString(),
        newValue: { is_active: isActive },
        context: {
          module: 'UserService',
          action: 'updateUserStatus',
        },
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 重置用户密码（管理员功能）
   * @param id 用户ID
   * @param newPassword 新密码
   * @returns 更新后的用户
   */
  async resetUserPassword(id: number, newPassword: string) {
    try {
      const hashedPassword = await this.passwordService.hashPassword(newPassword);
      
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      this.customLogger.logSecurity('password_reset_by_admin', id.toString(), undefined, {
        timestamp: new Date().toISOString(),
      });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}

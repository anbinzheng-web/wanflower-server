import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from 'user/services/user.service';
import { PasswordService } from 'shared/services/password.service';
import { EmailVerificationService } from 'shared/services/email-verification.service';
import { DeviceService } from 'shared/services/device.service';
import { LoginAttemptService } from 'shared/services/login-attempt.service';
import { RefreshTokenService } from 'shared/services/refresh-token.service';
import { PrismaService } from 'shared/services/prisma.service';
import { JwtService } from '@nestjs/jwt';
// import { VerificationType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private emailVerificationService: EmailVerificationService,
    private deviceService: DeviceService,
    private loginAttemptService: LoginAttemptService,
    private refreshTokenService: RefreshTokenService,
    private prisma: PrismaService,
  ) {}

  async validateUser(
    email: string, 
    pass: string, 
    ipAddress?: string, 
    userAgent?: string
  ) {
    try {
      // 检查登录尝试限制
      if (ipAddress) {
        await this.loginAttemptService.checkLoginAttempts(email, ipAddress);
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        // 记录失败的登录尝试
        if (ipAddress) {
        await this.loginAttemptService.recordLoginAttempt(
          email, 
          ipAddress, 
          userAgent || null, 
          false, 
          'User not found'
        );
        }
        return null;
      }

      // 检查用户是否激活
      if (!user.is_active) {
        if (ipAddress) {
        await this.loginAttemptService.recordLoginAttempt(
          email, 
          ipAddress, 
          userAgent || null, 
          false, 
          'Account disabled'
        );
        }
        throw new UnauthorizedException('Account is disabled');
      }

      // 检查邮箱是否已验证
      if (!user.is_verified) {
        if (ipAddress) {
        await this.loginAttemptService.recordLoginAttempt(
          email, 
          ipAddress, 
          userAgent || null, 
          false, 
          'Email not verified'
        );
        }
        throw new UnauthorizedException('Please verify your email first');
      }

      // 验证密码
      if (!user.password) {
        // 记录失败的登录尝试
        if (ipAddress) {
          await this.loginAttemptService.recordLoginAttempt(
            email, 
            ipAddress, 
            userAgent || null, 
            false, 
            'No password set'
          );
        }
        return null;
      }

      const isPasswordValid = await this.passwordService.verifyPassword(pass, user.password);
      if (!isPasswordValid) {
        // 记录失败的登录尝试
        if (ipAddress) {
        await this.loginAttemptService.recordLoginAttempt(
          email, 
          ipAddress, 
          userAgent || null, 
          false, 
          'Invalid password'
        );
        }
        return null;
      }

      // 检查密码是否需要重新加密
      if (user.password && this.passwordService.needsRehash(user.password)) {
        const newHashedPassword = await this.passwordService.hashPassword(pass);
        await this.userService.updatePassword(user.id, newHashedPassword);
      }

      // 记录成功的登录尝试
      if (ipAddress) {
        await this.loginAttemptService.recordLoginAttempt(
          email, 
          ipAddress, 
          userAgent || null, 
          true
        );
      }

      // 返回最小用户信息
      return { id: user.id, email: user.email, role: user.role };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw error;
    }
  }

  async login(
    user: { id: number; email: string; role: string },
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // 生成Access Token（15分钟有效期）
      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        type: 'access'
      };
      const accessToken = this.jwtService.sign(payload, { 
        expiresIn: '15m' 
      });

      // 生成Refresh Token（7天有效期）
      const refreshTokenRecord = await this.refreshTokenService.generateRefreshToken(
        user.id, 
        deviceId
      );

      // 注册或更新设备信息
      if (deviceId && ipAddress && userAgent) {
        await this.deviceService.registerOrUpdateDevice(user.id, {
          deviceId,
          userAgent,
          ipAddress,
        });
      }

      // 更新用户登录信息
      await this.userService.updateLastLogin(user.id);

      return {
        access_token: accessToken,
        refresh_token: refreshTokenRecord.token,
        expires_in: 900, // 15分钟，单位秒
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 刷新Access Token
   * @param refreshToken Refresh Token
   * @returns 新的Access Token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // 验证Refresh Token
      const tokenRecord = await this.refreshTokenService.validateRefreshToken(refreshToken);
      
      // 生成新的Access Token
      const payload = { 
        sub: (tokenRecord as any).user.id, 
        email: (tokenRecord as any).user.email, 
        role: (tokenRecord as any).user.role,
        type: 'access'
      };
      const accessToken = this.jwtService.sign(payload, { 
        expiresIn: '15m' 
      });

      return {
        access_token: accessToken,
        expires_in: 900, // 15分钟，单位秒
        token_type: 'Bearer',
        user: {
          id: (tokenRecord as any).user.id,
          email: (tokenRecord as any).user.email,
          role: (tokenRecord as any).user.role,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 登出
   * @param refreshToken Refresh Token
   */
  async logout(refreshToken: string) {
    try {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   * @param type 验证类型
   */
  async sendVerificationCode(email: string, type: string) {
    try {
      // 检查是否可以发送验证码
      const canSend = await this.emailVerificationService.canSendCode(email);
      if (!canSend) {
        throw new BadRequestException('验证码发送过于频繁，请稍后再试');
      }

      // 生成验证码
      const code = await this.emailVerificationService.generateVerificationCode(email, type);
      
      return { message: '验证码已发送', code }; // 开发环境返回验证码
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱地址
   * @param code 验证码
   * @param type 验证类型
   */
  async verifyEmailCode(email: string, code: string, type: string) {
    try {
      const isValid = await this.emailVerificationService.verifyCode(email, code, type);
      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }
      return { message: '验证成功' };
    } catch (error) {
      throw error;
    }
  }

  // TODO: Google OAuth2 用户处理 - 配置好Google开发者控制台信息后启用
  /*
  async handleGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
  }) {
    try {
      // 暂时简化实现，直接查找或创建用户
      let user = await this.userService.findByEmail(googleUser.email);
      
      if (!user) {
        // 创建新用户
        user = await this.userService.createUser(googleUser.email, '');
        
        // 更新用户信息
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            first_name: googleUser.firstName,
            last_name: googleUser.lastName,
            avatar_url: googleUser.picture,
            is_verified: true, // Google用户默认已验证
          },
        });
      }

      // 生成Token
      const result = await this.login({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        token_type: result.token_type,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar_url,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  */
}

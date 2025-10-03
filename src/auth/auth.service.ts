import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'user/services/user.service';
import { PasswordService } from 'shared/services/password.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService,
    private passwordService: PasswordService
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;
    
    // 使用新的密码验证服务
    const isPasswordValid = await this.passwordService.verifyPassword(pass, user.password);
    if (!isPasswordValid) return null;
    
    // 检查密码是否需要重新加密（例如盐值轮数增加时）
    if (this.passwordService.needsRehash(user.password)) {
      const newHashedPassword = await this.passwordService.hashPassword(pass);
      await this.userService.updatePassword(user.id, newHashedPassword);
    }
    
    // 返回最小用户信息
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(user: { id: number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      expires_in: process.env.JWT_EXPIRES_IN || '3600s',
    };
  }
}

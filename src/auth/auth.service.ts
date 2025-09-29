import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'user/services/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;
    if (user.password !== global.$md5(pass)) return null;
    // const match = await bcrypt.compare(pass, user.password);
    // if (!match) return null;
    // return minimal user payload
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

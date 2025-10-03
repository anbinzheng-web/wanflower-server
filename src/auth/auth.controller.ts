import { Controller, Post, Body, UnauthorizedException, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'user/services/user.service';
import { CreateUserDto, LoginDto } from 'user/dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
// import { AuthGuard } from '@nestjs/passport'; // TODO: 启用Google OAuth2时取消注释
// import { VerificationType } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '注册失败' })
  async register(@Body() dto: CreateUserDto, @Req() req: Request) {
    const user = await this.userService.createUser(dto.email, dto.password);
    
    // 发送邮箱验证码
    await this.authService.sendVerificationCode(dto.email, 'REGISTER');
    
    // 不返回 password
    return { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      message: '注册成功，请查收邮箱验证码'
    };
  }

  @Post('verify-email')
  @ApiOperation({ summary: '验证邮箱' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '验证失败' })
  async verifyEmail(@Body() body: { email: string; code: string }) {
    await this.authService.verifyEmailCode(body.email, body.code, 'REGISTER');
    
    // 验证成功后激活用户邮箱
    const user = await this.userService.findByEmail(body.email);
    if (user) {
      await this.userService.verifyUserEmail(user.id);
    }
    
    return { message: '邮箱验证成功' };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '登录失败' })
  async login(
    @Body() dto: LoginDto, 
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent');
    const deviceId = req.headers['x-device-id'] as string;

    const user = await this.authService.validateUser(
      dto.email, 
      dto.password, 
      ipAddress, 
      userAgent
    );
    
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const result = await this.authService.login(
      { id: user.id, email: user.email, role: user.role },
      deviceId,
      ipAddress,
      userAgent
    );

    // 设置HttpOnly Cookie存储Refresh Token
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    });

    return {
      access_token: result.access_token,
      expires_in: result.expires_in,
      token_type: result.token_type,
      user: result.user,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新Access Token' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '刷新失败' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // 清除Cookie
    res.clearCookie('refresh_token');

    return { message: '登出成功' };
  }

  @Post('send-verification-code')
  @ApiOperation({ summary: '发送验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  @ApiResponse({ status: 400, description: '发送失败' })
  async sendVerificationCode(@Body() body: { email: string; type: string }) {
    return await this.authService.sendVerificationCode(body.email, body.type);
  }

  // TODO: Google OAuth2 路由 - 配置好Google开发者控制台信息后启用
  /*
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth2 登录' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // 这个方法会被Google策略拦截，重定向到Google登录页面
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 回调' })
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // req.user 包含从Google策略返回的用户信息
      const result = req.user as any;
      
      // 设置HttpOnly Cookie存储Refresh Token
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      });

      // 重定向到前端页面，携带Access Token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      // 重定向到错误页面
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Google登录失败')}`);
    }
  }
  */
}

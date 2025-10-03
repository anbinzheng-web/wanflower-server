// TODO: Google OAuth2 集成 - 需要配置Google开发者控制台信息后启用
// 配置步骤：
// 1. 访问 https://console.developers.google.com/
// 2. 创建新项目或选择现有项目
// 3. 启用 Google+ API
// 4. 创建OAuth 2.0客户端ID
// 5. 设置授权重定向URI: http://localhost:3000/auth/google/callback
// 6. 在.env文件中配置以下环境变量：
//    GOOGLE_CLIENT_ID=your_google_client_id
//    GOOGLE_CLIENT_SECRET=your_google_client_secret
//    GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

/*
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      
      const user = {
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        accessToken,
        refreshToken,
      };

      const result = await this.authService.handleGoogleUser(user);
      done(null, result);
    } catch (error) {
      done(error, false);
    }
  }
}
*/
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from 'user/user.module';
import { JwtStrategy } from './jwt.strategy';
// import { GoogleStrategy } from './google.strategy'; // TODO: 启用Google OAuth2时取消注释
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '3600s' },
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    // GoogleStrategy, // TODO: 启用Google OAuth2时取消注释
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

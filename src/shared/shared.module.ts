import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { UploadService } from './services/upload/upload.service';
import { LocalStorageService } from './services/upload/local-storage.service';
import { OssStorageService } from './services/upload/oss-storage.service';
import { PasswordService } from './services/password.service';
import { CustomLoggerService } from './logger/logger.service';
import { EmailVerificationService } from './services/email-verification.service';
import { DeviceService } from './services/device.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Global()
@Module({
  providers: [
    PrismaService,
    UploadService,
    PasswordService,
    CustomLoggerService,
    EmailVerificationService,
    DeviceService,
    LoginAttemptService,
    RefreshTokenService,
    {
      provide: 'STORAGE_SERVICE',
      useClass: process.env.STORAGE_DRIVER === 'oss'
        ? OssStorageService
        : LocalStorageService,
    },
  ],
  exports: [
    PrismaService, 
    UploadService, 
    PasswordService, 
    CustomLoggerService,
    EmailVerificationService,
    DeviceService,
    LoginAttemptService,
    RefreshTokenService,
  ],
})
export class SharedModule {}
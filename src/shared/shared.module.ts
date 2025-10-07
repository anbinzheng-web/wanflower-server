import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { UploadService } from './services/upload/upload.service';
import { LocalStorageService } from './services/upload/local-storage.service';
import { OssStorageService } from './services/upload/oss-storage.service';
import { CdnStorageService } from './services/upload/cdn-storage.service';
import { PasswordService } from './services/password.service';
import { CustomLoggerService } from './logger/logger.service';
import { EmailVerificationService } from './services/email-verification.service';
import { DeviceService } from './services/device.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RedisService } from './services/redis.service';
import { CacheService } from './services/cache.service';
import { RedisHealthService } from './services/redis-health.service';
import { RedisHealthController } from './controllers/redis-health.controller';
import { SchedulerService } from './services/scheduler.service';
import { MediaManagementService } from './services/media/media-management.service';
import { MediaController } from './controllers/media.controller';
import { StorageHealthController } from './controllers/storage-health.controller';

@Global()
@Module({
  controllers: [RedisHealthController, MediaController, StorageHealthController],
  providers: [
    PrismaService,
    UploadService,
    PasswordService,
    CustomLoggerService,
    EmailVerificationService,
    DeviceService,
    LoginAttemptService,
    RefreshTokenService,
    RedisService,
    CacheService,
    RedisHealthService,
    SchedulerService,
    MediaManagementService,
    {
      provide: 'STORAGE_SERVICE',
      useFactory: () => {
        const storageDriver = process.env.STORAGE_DRIVER || 'local';
        switch (storageDriver) {
          case 'oss':
            return new OssStorageService();
          case 'cdn':
            return new CdnStorageService();
          case 'local':
          default:
            return new LocalStorageService();
        }
      },
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
    RedisService,
    CacheService,
    RedisHealthService,
    SchedulerService,
    MediaManagementService,
  ],
})
export class SharedModule {}
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { UploadService } from './services/upload/upload.service';
import { LocalStorageService } from './services/upload/local-storage.service';
import { OssStorageService } from './services/upload/oss-storage.service';
import { PasswordService } from './services/password.service';
import { CustomLoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [
    PrismaService,
    UploadService,
    PasswordService,
    CustomLoggerService,
    {
      provide: 'STORAGE_SERVICE',
      useClass: process.env.STORAGE_DRIVER === 'oss'
        ? OssStorageService
        : LocalStorageService,
    },
  ],
  exports: [PrismaService, UploadService, PasswordService, CustomLoggerService],
})
export class SharedModule {}
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './services/prisma.service';
import {  } from './services/upload.service';
import { LoggerModule } from 'shared/logger/logger.module';
import { LoggerInterceptor } from 'shared/logger/logger.interceptor';
import { UploadService } from './services/upload/upload.service';
import { LocalStorageService } from './services/upload/local-storage.service';
import { OssStorageService } from './services/upload/oss-storage.service';

@Global()
@Module({
  providers: [
    PrismaService,
    UploadService,
    {
      provide: 'STORAGE_SERVICE',
      useClass: process.env.STORAGE_DRIVER === 'oss'
        ? OssStorageService
        : LocalStorageService,
    },
  ],
  exports: [PrismaService, UploadService],
})
export class SharedModule {}
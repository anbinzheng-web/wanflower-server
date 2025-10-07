// upload.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { IStorageService } from './local-storage.service';
import Express from 'express';

@Injectable()
export class UploadService {
  constructor(
    @Inject('STORAGE_SERVICE')
    private readonly storageService: IStorageService,
  ) {}

  upload(file: Express.Multer.File, businessType?: string) {
    // 如果存储服务支持业务类型参数，则传递
    if (typeof this.storageService.upload === 'function' && this.storageService.upload.length > 1) {
      return (this.storageService as any).upload(file, businessType);
    }
    return this.storageService.upload(file);
  }

  delete(fileKey: string) {
    return this.storageService.delete(fileKey);
  }
}

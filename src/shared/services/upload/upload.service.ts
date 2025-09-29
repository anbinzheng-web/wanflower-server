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

  upload(file: Express.Multer.File) {
    return this.storageService.upload(file);
  }

  delete(fileKey: string) {
    return this.storageService.delete(fileKey);
  }
}

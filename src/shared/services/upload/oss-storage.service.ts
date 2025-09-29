// oss-storage.service.ts
import { Injectable } from '@nestjs/common';
import { IStorageService } from './local-storage.service';
import Express from 'express';
// import { IStorageService } from './storage.interface';
// import OSS from 'ali-oss';

@Injectable()
export class OssStorageService implements IStorageService {
  // private client = new OSS({
  //   region: process.env.OSS_REGION,
  //   accessKeyId: process.env.OSS_ACCESS_KEY,
  //   accessKeySecret: process.env.OSS_SECRET_KEY,
  //   bucket: process.env.OSS_BUCKET,
  // });

  async upload(file: Express.Multer.File): Promise<string> {
    // const result = await this.client.put(file.originalname, file.buffer);
    // return result.url;
    return file.originalname;
  }

  async delete(fileKey: string): Promise<void> {
    // await this.client.delete(fileKey);
  }
}

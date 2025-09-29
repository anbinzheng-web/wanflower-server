import Express from 'express';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import util from 'util';

// storage.interface.ts
export interface IStorageService {
  upload(file: Express.Multer.File): Promise<string>; // 返回文件URL
  delete(fileKey: string): Promise<void>;
}

@Injectable()
export class LocalStorageService implements IStorageService {
  async upload(file: Express.Multer.File): Promise<string> {
    // 给这个文件生成一个 hash 名，防止冲突
    const fileHash = global.$md5(file.toString());
    const imageType = path.extname(file.originalname);
    const filename = `${fileHash}${imageType}`;
    const uploadPath = path.join(process.cwd(), process.env.IMAGE_LOCAL_UPLOAD_PATH!, filename);
    await util.promisify(fs.writeFile)(uploadPath, file.buffer);
    // 返回本地访问路径，实际要配合静态资源服务
    return `/uploads/${filename}`;
  }

  async delete(fileKey: string): Promise<void> {
    const filePath = path.join(__dirname, process.env.IMAGE_LOCAL_UPLOAD_PATH!, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

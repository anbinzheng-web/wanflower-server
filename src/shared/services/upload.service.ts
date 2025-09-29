import Express from 'express';
// local-storage.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import util from 'util';
import * as bcrypt from 'bcrypt';

// storage.interface.ts
export interface IStorageService {
  upload(file: Express.Multer.File): Promise<string>; // 返回文件URL
  delete(fileKey: string): Promise<void>;
}

@Injectable()
export class LocalStorageService implements IStorageService {
  async upload(file: Express.Multer.File): Promise<string> {
    // 文件名 hash 化吧
    const fileHash = await bcrypt.hash(file.originalname + Date.now(), 10);
    const imageType = path.extname(file.originalname);
    const filename = `${fileHash}.${imageType}`;
    const uploadPath = path.join(process.cwd(), 'uploads', filename);
    await util.promisify(fs.writeFile)(uploadPath, file.buffer);
    // 返回本地访问路径，实际要配合静态资源服务
    return `/uploads/${filename}`;
  }

  async delete(fileKey: string): Promise<void> {
    const filePath = path.join(__dirname, 'uploads', fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

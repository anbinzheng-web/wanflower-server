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
  async upload(file: Express.Multer.File, businessType?: string): Promise<string> {
    // 给这个文件生成一个 hash 名，防止冲突
    const fileHash = global.$md5(file.buffer.toString());
    const imageType = path.extname(file.originalname);
    const filename = `${fileHash}${imageType}`;
    
    // 根据业务类型创建分类目录
    const businessPath = this.getBusinessTypePath(businessType);
    const uploadDir = path.join(process.cwd(), process.env.IMAGE_LOCAL_UPLOAD_PATH!, businessPath);
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const uploadPath = path.join(uploadDir, filename);
    await util.promisify(fs.writeFile)(uploadPath, file.buffer);
    
    // 返回本地访问路径，包含业务类型分类（不包含前缀，让前端自己拼接）
    return `${businessPath}/${filename}`;
  }

  /**
   * 获取业务类型对应的存储路径
   */
  private getBusinessTypePath(businessType?: string): string {
    if (!businessType) {
      return 'general';
    }
    
    const paths = {
      'PRODUCT': 'products',
      'BLOG': 'blogs', 
      'REVIEW': 'reviews',
      'USER': 'users',
      'GENERAL': 'general'
    };
    return paths[businessType] || 'general';
  }

  async delete(fileKey: string): Promise<void> {
    const filePath = path.join(__dirname, process.env.IMAGE_LOCAL_UPLOAD_PATH!, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

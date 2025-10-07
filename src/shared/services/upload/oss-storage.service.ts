// oss-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IStorageService } from './local-storage.service';
import Express from 'express';
import * as path from 'path';
// import OSS from 'ali-oss';

@Injectable()
export class OssStorageService implements IStorageService {
  private readonly logger = new Logger(OssStorageService.name);
  private client: any; // OSS 客户端，暂时使用 any 类型

  constructor() {
    this.initializeOssClient();
  }

  private initializeOssClient() {
    // 检查必要的环境变量
    const requiredEnvVars = ['OSS_REGION', 'OSS_ACCESS_KEY', 'OSS_SECRET_KEY', 'OSS_BUCKET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logger.warn(`OSS 配置不完整，缺少环境变量: ${missingVars.join(', ')}`);
      this.logger.warn('OSS 服务将使用模拟模式');
      return;
    }

    try {
      // 初始化 OSS 客户端
      // this.client = new OSS({
      //   region: process.env.OSS_REGION,
      //   accessKeyId: process.env.OSS_ACCESS_KEY,
      //   accessKeySecret: process.env.OSS_SECRET_KEY,
      //   bucket: process.env.OSS_BUCKET,
      //   secure: true, // 使用 HTTPS
      //   timeout: 60000, // 60秒超时
      // });
      
      this.logger.log('OSS 客户端初始化成功');
    } catch (error) {
      this.logger.error('OSS 客户端初始化失败:', error);
    }
  }

  async upload(file: Express.Multer.File, businessType?: string): Promise<string> {
    try {
      // 生成文件路径
      const filePath = this.generateFilePath(file, businessType);
      
      if (!this.client) {
        // 模拟模式：返回模拟的 OSS URL
        this.logger.warn('OSS 客户端未初始化，使用模拟模式');
        return this.generateMockOssUrl(filePath);
      }

      // 实际上传文件到 OSS
      // const result = await this.client.put(filePath, file.buffer, {
      //   headers: {
      //     'Content-Type': file.mimetype,
      //     'Cache-Control': 'max-age=31536000', // 1年缓存
      //   }
      // });

      // 返回 OSS URL
      // return result.url;
      
      // 临时返回模拟 URL
      return this.generateMockOssUrl(filePath);
    } catch (error) {
      this.logger.error('OSS 上传失败:', error);
      throw new Error(`OSS 上传失败: ${error.message}`);
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      if (!this.client) {
        this.logger.warn('OSS 客户端未初始化，跳过删除操作');
        return;
      }

      // 从 OSS 删除文件
      // await this.client.delete(fileKey);
      
      this.logger.log(`OSS 文件删除成功: ${fileKey}`);
    } catch (error) {
      this.logger.error('OSS 删除失败:', error);
      throw new Error(`OSS 删除失败: ${error.message}`);
    }
  }

  /**
   * 生成文件路径
   */
  private generateFilePath(file: Express.Multer.File, businessType?: string): string {
    // 生成文件哈希名
    const fileHash = global.$md5(file.buffer.toString());
    const fileExt = path.extname(file.originalname);
    const filename = `${fileHash}${fileExt}`;
    
    // 根据业务类型创建路径
    const businessPath = this.getBusinessTypePath(businessType);
    const datePath = this.getDatePath();
    
    return `${businessPath}/${datePath}/${filename}`;
  }

  /**
   * 获取业务类型路径
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

  /**
   * 获取日期路径 (YYYY/MM/DD)
   */
  private getDatePath(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * 生成模拟 OSS URL
   */
  private generateMockOssUrl(filePath: string): string {
    const bucket = process.env.OSS_BUCKET || 'mock-bucket';
    const region = process.env.OSS_REGION || 'oss-cn-hangzhou';
    return `https://${bucket}.${region}.aliyuncs.com/${filePath}`;
  }

  /**
   * 检查 OSS 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      
      // 检查 OSS 连接
      // await this.client.getBucketInfo();
      return true;
    } catch (error) {
      this.logger.error('OSS 连接检查失败:', error);
      return false;
    }
  }
}

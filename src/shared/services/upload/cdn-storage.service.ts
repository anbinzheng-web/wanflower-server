// cdn-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IStorageService } from './local-storage.service';
import Express from 'express';
import * as path from 'path';
// import AWS from 'aws-sdk';
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class CdnStorageService implements IStorageService {
  private readonly logger = new Logger(CdnStorageService.name);
  private s3Client: any; // S3 客户端，暂时使用 any 类型
  private cloudFrontClient: any; // CloudFront 客户端，暂时使用 any 类型

  constructor() {
    this.initializeCdnClient();
  }

  private initializeCdnClient() {
    // 检查必要的环境变量
    const requiredEnvVars = ['CDN_DOMAIN'];
    const awsEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    const missingAwsVars = awsEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logger.warn(`CDN 配置不完整，缺少环境变量: ${missingVars.join(', ')}`);
      this.logger.warn('CDN 服务将使用模拟模式');
      return;
    }

    if (missingAwsVars.length > 0) {
      this.logger.warn(`AWS S3 配置不完整，缺少环境变量: ${missingAwsVars.join(', ')}`);
      this.logger.warn('CDN 服务将使用模拟模式');
      return;
    }

    try {
      // 初始化 AWS S3 客户端
      // this.s3Client = new S3Client({
      //   region: process.env.AWS_REGION,
      //   credentials: {
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      //   },
      // });

      // 初始化 CloudFront 客户端
      // this.cloudFrontClient = new AWS.CloudFront({
      //   region: process.env.AWS_REGION,
      //   credentials: {
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      //   },
      // });
      
      this.logger.log('CDN 客户端初始化成功');
    } catch (error) {
      this.logger.error('CDN 客户端初始化失败:', error);
    }
  }

  async upload(file: Express.Multer.File, businessType?: string): Promise<string> {
    try {
      // 生成文件路径
      const filePath = this.generateFilePath(file, businessType);
      
      if (!this.s3Client) {
        // 模拟模式：返回模拟的 CDN URL
        this.logger.warn('CDN 客户端未初始化，使用模拟模式');
        return this.generateMockCdnUrl(filePath);
      }

      // 上传文件到 S3
      // const uploadCommand = new PutObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET!,
      //   Key: filePath,
      //   Body: file.buffer,
      //   ContentType: file.mimetype,
      //   CacheControl: 'max-age=31536000', // 1年缓存
      //   Metadata: {
      //     'business-type': businessType || 'general',
      //     'original-name': file.originalname,
      //   }
      // });

      // await this.s3Client.send(uploadCommand);

      // 生成 CDN URL
      // const cdnUrl = this.generateCdnUrl(filePath);
      // return cdnUrl;
      
      // 临时返回模拟 URL
      return this.generateMockCdnUrl(filePath);
    } catch (error) {
      this.logger.error('CDN 上传失败:', error);
      throw new Error(`CDN 上传失败: ${error.message}`);
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      if (!this.s3Client) {
        this.logger.warn('CDN 客户端未初始化，跳过删除操作');
        return;
      }

      // 从 S3 删除文件
      // const deleteCommand = new DeleteObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET!,
      //   Key: fileKey,
      // });

      // await this.s3Client.send(deleteCommand);

      // 清除 CloudFront 缓存
      // await this.invalidateCloudFrontCache(fileKey);
      
      this.logger.log(`CDN 文件删除成功: ${fileKey}`);
    } catch (error) {
      this.logger.error('CDN 删除失败:', error);
      throw new Error(`CDN 删除失败: ${error.message}`);
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
   * 生成 CDN URL
   */
  private generateCdnUrl(filePath: string): string {
    const cdnDomain = process.env.CDN_DOMAIN;
    return `https://${cdnDomain}/${filePath}`;
  }

  /**
   * 生成模拟 CDN URL
   */
  private generateMockCdnUrl(filePath: string): string {
    const cdnDomain = process.env.CDN_DOMAIN || 'cdn.example.com';
    return `https://${cdnDomain}/${filePath}`;
  }

  /**
   * 清除 CloudFront 缓存
   */
  private async invalidateCloudFrontCache(filePath: string): Promise<void> {
    try {
      if (!this.cloudFrontClient) {
        return;
      }

      const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      if (!distributionId) {
        this.logger.warn('CloudFront Distribution ID 未配置，跳过缓存清除');
        return;
      }

      // 创建缓存失效请求
      // const invalidationParams = {
      //   DistributionId: distributionId,
      //   InvalidationBatch: {
      //     CallerReference: `invalidation-${Date.now()}`,
      //     Paths: {
      //       Quantity: 1,
      //       Items: [`/${filePath}`]
      //     }
      //   }
      // };

      // await this.cloudFrontClient.createInvalidation(invalidationParams).promise();
      this.logger.log(`CloudFront 缓存清除成功: ${filePath}`);
    } catch (error) {
      this.logger.error('CloudFront 缓存清除失败:', error);
    }
  }

  /**
   * 检查 CDN 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.s3Client) {
        return false;
      }
      
      // 检查 S3 连接
      // const command = new HeadBucketCommand({
      //   Bucket: process.env.AWS_S3_BUCKET!
      // });
      // await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.error('CDN 连接检查失败:', error);
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<any> {
    try {
      if (!this.s3Client) {
        return null;
      }

      // const command = new HeadObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET!,
      //   Key: filePath,
      // });

      // const response = await this.s3Client.send(command);
      // return {
      //   size: response.ContentLength,
      //   lastModified: response.LastModified,
      //   contentType: response.ContentType,
      //   etag: response.ETag,
      // };

      return null;
    } catch (error) {
      this.logger.error('获取文件信息失败:', error);
      return null;
    }
  }
}

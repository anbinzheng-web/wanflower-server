import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UploadService } from '../upload/upload.service';
import { MediaType, StorageType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export interface MediaUploadOptions {
  file: any;
  businessType: 'PRODUCT' | 'BLOG' | 'REVIEW' | 'USER' | 'GENERAL';
  businessId?: number;
  type: MediaType;
  altText?: string;
  sortOrder?: number;
  category?: string;
  userId?: number;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  thumbnailPath?: string;
}

@Injectable()
export class MediaManagementService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  /**
   * 获取业务类型对应的存储路径
   */
  private getBusinessTypePath(businessType: string): string {
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
   * 解析上传结果，确定存储类型和路径
   */
  private parseStorageInfo(uploadResult: string, businessType: string) {
    // 检查是否是 OSS URL（通常包含 OSS 域名）
    if (uploadResult.includes('oss-') || uploadResult.includes('aliyuncs.com')) {
      return {
        storageType: StorageType.OSS,
        localPath: null,
        ossUrl: uploadResult,
        ossKey: this.extractOssKey(uploadResult),
        cdnUrl: null,
        cdnKey: null
      };
    }
    
    // 检查是否是 CDN URL
    if (uploadResult.includes('cdn.') || uploadResult.includes('cloudfront.') || uploadResult.includes('cloudflare.')) {
      return {
        storageType: StorageType.CDN,
        localPath: null,
        ossUrl: null,
        ossKey: null,
        cdnUrl: uploadResult,
        cdnKey: this.extractCdnKey(uploadResult)
      };
    }
    
    // 默认本地存储，但需要按业务类型分类
    const businessPath = this.getBusinessTypePath(businessType);
    const localPath = uploadResult.startsWith('/') ? uploadResult : `/${uploadResult}`;
    
    return {
      storageType: StorageType.LOCAL,
      localPath: localPath,
      ossUrl: null,
      ossKey: null,
      cdnUrl: null,
      cdnKey: null
    };
  }

  /**
   * 从 OSS URL 中提取存储键
   */
  private extractOssKey(ossUrl: string): string {
    try {
      const url = new URL(ossUrl);
      return url.pathname.substring(1); // 移除开头的 '/'
    } catch {
      return ossUrl;
    }
  }

  /**
   * 从 CDN URL 中提取存储键
   */
  private extractCdnKey(cdnUrl: string): string {
    try {
      const url = new URL(cdnUrl);
      return url.pathname.substring(1); // 移除开头的 '/'
    } catch {
      return cdnUrl;
    }
  }

  /**
   * 验证媒体文件
   */
  private validateMediaFile(file: any, type: MediaType): void {
    const allowedTypes = {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/webm', 'video/ogg']
    };

    const maxSizes = {
      IMAGE: 10 * 1024 * 1024, // 10MB
      VIDEO: 100 * 1024 * 1024  // 100MB
    };

    if (!allowedTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }

    if (file.size > maxSizes[type]) {
      throw new BadRequestException(`文件大小超过限制: ${type === 'IMAGE' ? '10MB' : '100MB'}`);
    }
  }

  /**
   * 提取媒体元数据
   */
  private async extractMediaMetadata(file: any, filePath: string): Promise<MediaMetadata> {
    const metadata: MediaMetadata = {};

    try {
      if (file.mimetype.startsWith('image/')) {
        const imageInfo = await sharp(file.buffer).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;

        // 生成缩略图
        const thumbnailPath = await this.generateThumbnail(file.buffer, filePath);
        metadata.thumbnailPath = thumbnailPath;
      } else if (file.mimetype.startsWith('video/')) {
        // 这里可以集成 ffmpeg 来获取视频元数据
        // 暂时返回默认值
        metadata.duration = 0;
      }
    } catch (error) {
      console.warn('提取媒体元数据失败:', error);
    }

    return metadata;
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(buffer: Buffer, originalPath: string): Promise<string> {
    try {
      const thumbnailDir = path.join(process.cwd(), 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      const filename = path.basename(originalPath);
      const nameWithoutExt = path.parse(filename).name;
      const ext = path.extname(originalPath);
      const thumbnailPath = path.join('uploads', 'thumbnails', `${nameWithoutExt}_thumb${ext}`);

      await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return `thumbnails/${nameWithoutExt}_thumb${ext}`;
    } catch (error) {
      console.warn('生成缩略图失败:', error);
      return '';
    }
  }

  /**
   * 获取媒体URL
   */
  public getMediaUrl(mediaRecord: any): string {
    switch (mediaRecord.storage_type) {
      case StorageType.LOCAL:
        // 本地存储时，自动拼接 /images 前缀
        return mediaRecord.local_path ? `/images${mediaRecord.local_path}` : '';
      case StorageType.OSS:
        return mediaRecord.oss_url || '';
      case StorageType.CDN:
        return mediaRecord.cdn_url || '';
      default:
        return mediaRecord.local_path ? `/images${mediaRecord.local_path}` : '';
    }
  }

  /**
   * 获取缩略图URL
   */
  public getThumbnailUrl(mediaRecord: any): string {
    switch (mediaRecord.storage_type) {
      case StorageType.LOCAL:
        // 本地存储时，自动拼接 /images 前缀
        return mediaRecord.thumbnail_local ? `/images/${mediaRecord.thumbnail_local}` : this.getMediaUrl(mediaRecord);
      case StorageType.OSS:
        return mediaRecord.thumbnail_oss || this.getMediaUrl(mediaRecord);
      case StorageType.CDN:
        return mediaRecord.thumbnail_cdn || this.getMediaUrl(mediaRecord);
      default:
        return mediaRecord.thumbnail_local ? `/images/${mediaRecord.thumbnail_local}` : this.getMediaUrl(mediaRecord);
    }
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(options: MediaUploadOptions) {
    const { file, businessType, businessId, type, altText, sortOrder, category, userId } = options;

    // 验证文件
    this.validateMediaFile(file, type);

    // 使用现有的上传服务上传文件，传递业务类型用于分类存储
    const uploadResult = await this.uploadService.upload(file, businessType);

    // 提取元数据
    const metadata = await this.extractMediaMetadata(file, uploadResult);

    // 根据上传结果确定存储类型和路径
    const storageInfo = this.parseStorageInfo(uploadResult, businessType);

    // 保存到数据库
    const mediaRecord = await this.prisma.media.create({
      data: {
        business_type: businessType,
        business_id: businessId,
        type: type,
        storage_type: storageInfo.storageType,
        local_path: storageInfo.localPath,
        oss_url: storageInfo.ossUrl,
        oss_key: storageInfo.ossKey,
        cdn_url: storageInfo.cdnUrl,
        cdn_key: storageInfo.cdnKey,
        filename: file.originalname,
        file_size: BigInt(file.size),
        mime_type: file.mimetype,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        thumbnail_local: metadata.thumbnailPath,
        alt_text: altText,
        sort_order: sortOrder || 0,
        category: category || 'DEFAULT',
        user_id: userId
      }
    });

    return {
      id: mediaRecord.id,
      url: this.getMediaUrl(mediaRecord),
      thumbnail_url: this.getThumbnailUrl(mediaRecord),
      filename: mediaRecord.filename,
      file_size: String(mediaRecord.file_size),
      mime_type: mediaRecord.mime_type,
      width: mediaRecord.width,
      height: mediaRecord.height,
      duration: mediaRecord.duration,
      alt_text: mediaRecord.alt_text,
      sort_order: mediaRecord.sort_order,
      category: mediaRecord.category,
      created_at: mediaRecord.created_at
    };
  }

  /**
   * 批量上传媒体文件
   */
  async batchUploadMedia(files: any[], options: Omit<MediaUploadOptions, 'file'>) {
    const results: Array<{
      success: boolean;
      data?: any;
      error?: string;
      filename?: string;
    }> = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadMedia({ ...options, file });
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          filename: file.originalname 
        });
      }
    }

    return results;
  }

  /**
   * 获取媒体列表
   */
  async getMediaList(params: {
    businessType?: string;
    businessId?: number;
    type?: MediaType;
    category?: string;
    userId?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { businessType, businessId, type, category, userId, page = 1, pageSize = 20 } = params;

    const where: any = {};
    if (businessType) where.business_type = businessType;
    if (businessId) where.business_id = businessId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (userId) where.user_id = userId;

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.media.count({ where })
    ]);

    return {
      records: media.map(item => ({
        ...item,
        url: this.getMediaUrl(item),
        thumbnail_url: this.getThumbnailUrl(item),
        file_size: String(item.file_size)
      })),
      total,
      page,
      page_size: pageSize
    };
  }

  /**
   * 删除媒体文件
   */
  async deleteMedia(id: number, userId?: number) {
    const media = await this.prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 权限检查
    if (userId && media.user_id !== userId) {
      throw new BadRequestException('无权限删除此文件');
    }

    // 删除物理文件
    try {
      switch (media.storage_type) {
        case StorageType.LOCAL:
          if (media.local_path) {
            const fullPath = path.join(process.cwd(), media.local_path);
            if (fs.existsSync(fullPath)) {
              await fs.promises.unlink(fullPath);
            }
          }
          // 删除本地缩略图
          if (media.thumbnail_local) {
            const thumbnailPath = path.join(process.cwd(), media.thumbnail_local);
            if (fs.existsSync(thumbnailPath)) {
              await fs.promises.unlink(thumbnailPath);
            }
          }
          break;
        case StorageType.OSS:
          // 使用 OSS 服务删除文件
          if (media.oss_key) {
            await this.uploadService.delete(media.oss_key);
          }
          // 删除 OSS 缩略图
          if (media.thumbnail_oss) {
            await this.uploadService.delete(media.thumbnail_oss);
          }
          break;
        case StorageType.CDN:
          // CDN 通常不需要删除，或者需要调用 CDN 的删除 API
          // 这里可以根据具体的 CDN 服务实现
          console.log('CDN 文件删除需要手动处理:', media.cdn_url);
          break;
      }
    } catch (error) {
      console.warn('删除文件失败:', error);
    }

    // 删除数据库记录
    await this.prisma.media.delete({
      where: { id }
    });

    return { message: '删除成功' };
  }

  /**
   * 更新媒体信息
   */
  async updateMedia(id: number, data: {
    alt_text?: string;
    sort_order?: number;
    category?: string;
  }, userId?: number) {
    const media = await this.prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 权限检查
    if (userId && media.user_id !== userId) {
      throw new BadRequestException('无权限修改此文件');
    }

    return this.prisma.media.update({
      where: { id },
      data
    });
  }

  /**
   * 根据ID获取媒体信息
   */
  async getMediaById(id: number) {
    return this.prisma.media.findUnique({
      where: { id }
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from 'shared/services/prisma.service';
import { UploadService } from 'shared/services/upload/upload.service';
import { 
  ProductMediaUploadDto, ProductMediaUpdateDto, ProductMediaDeleteDto,
  ProductMediaMigrateToCdnDto
} from '../dtos';
import { MediaType, StorageType, MediaCategory } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ProductMediaService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  // ================================
  // 媒体文件上传相关方法
  // ================================

  /**
   * 上传产品媒体文件
   */
  async uploadProductMedia(file: any, data: Omit<ProductMediaUploadDto, 'file'>) {
    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: data.product_id, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 验证文件类型和大小
    this.validateMediaFile(file, data.type);

    // 上传文件到本地存储
    const uploadResult = await this.uploadService.upload(file);

    // 获取文件元数据
    const mediaMetadata = await this.extractMediaMetadata(file, uploadResult);

    // 保存媒体记录到数据库
    const mediaRecord = await this.prisma.productMedia.create({
      data: {
        product_id: data.product_id,
        type: data.type as any,
        storage_type: StorageType.LOCAL,
        local_path: uploadResult,
        filename: file.originalname,
        file_size: BigInt(file.size),
        mime_type: file.mimetype,
        width: mediaMetadata.width,
        height: mediaMetadata.height,
        duration: mediaMetadata.duration,
        thumbnail_local: mediaMetadata.thumbnailPath,
        alt_text: data.alt_text,
        sort_order: data.sort_order || 0,
        media_category: data.media_category || 'MAIN'
      }
    });

    return {
      url: this.getMediaUrl(mediaRecord),
      thumbnail_url: this.getThumbnailUrl(mediaRecord),
      ...mediaRecord
    };
  }

  /**
   * 批量上传产品媒体文件
   */
  async batchUploadProductMedia(
    files: any[], 
    productId: number, 
    type: MediaType
  ) {
    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadProductMedia(file, {
          product_id: productId,
          type: type as any,
          sort_order: i,
          media_category: MediaCategory.GALLERY as any
        });
        results.push(result);
      } catch (error) {
        // 记录错误但继续处理其他文件
        console.error(`上传文件 ${file.originalname} 失败:`, error);
        results.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return results;
  }

  // ================================
  // 媒体文件管理相关方法
  // ================================

  /**
   * 更新媒体文件信息
   */
  async updateProductMedia(data: ProductMediaUpdateDto) {
    const media = await this.prisma.productMedia.findUnique({
      where: { id: data.id }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    return await this.prisma.productMedia.update({
      where: { id: data.id },
      data: {
        media_category: data.media_category,
        sort_order: data.sort_order,
        alt_text: data.alt_text
      }
    });
  }

  /**
   * 删除媒体文件
   */
  async deleteProductMedia(data: ProductMediaDeleteDto) {
    const media = await this.prisma.productMedia.findUnique({
      where: { id: data.id }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 删除数据库记录
    await this.prisma.productMedia.delete({
      where: { id: data.id }
    });

    // 删除本地文件
    if (media.storage_type === StorageType.LOCAL) {
      try {
        if (media.local_path) {
          await fs.unlink(media.local_path);
        }
        if (media.thumbnail_local) {
          await fs.unlink(media.thumbnail_local);
        }
      } catch (error) {
        console.error('删除本地文件失败:', error);
      }
    }

    return { success: true };
  }

  /**
   * 获取产品的所有媒体文件
   */
  async getProductMedia(productId: number) {
    const media = await this.prisma.productMedia.findMany({
      where: { product_id: productId },
      orderBy: [
        { media_category: 'asc' },
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ]
    });

    return media.map(item => ({
      ...item,
      url: this.getMediaUrl(item),
      thumbnail_url: this.getThumbnailUrl(item)
    }));
  }

  // ================================
  // CDN 迁移相关方法
  // ================================

  /**
   * 将本地媒体文件迁移到CDN
   */
  async migrateMediaToCdn(data: ProductMediaMigrateToCdnDto) {
    const media = await this.prisma.productMedia.findUnique({
      where: { id: data.id }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    if (media.storage_type !== StorageType.LOCAL) {
      throw new BadRequestException('只能迁移本地存储的文件');
    }

    // 更新数据库记录
    return await this.prisma.productMedia.update({
      where: { id: data.id },
      data: {
        storage_type: StorageType.CDN,
        cdn_url: data.cdn_url,
        cdn_key: data.cdn_key
      }
    });
  }

  /**
   * 批量迁移产品媒体到CDN
   */
  async batchMigrateProductMediaToCdn(productId: number) {
    const mediaList = await this.prisma.productMedia.findMany({
      where: { 
        product_id: productId,
        storage_type: StorageType.LOCAL
      }
    });

    const results: any[] = [];

    for (const media of mediaList) {
      try {
        // TODO: 实际的CDN上传逻辑
        // const cdnResult = await this.uploadToCdn(media.local_path);
        
        // 模拟CDN上传结果
        const cdnResult = {
          url: `https://cdn.example.com/products/${media.filename}`,
          key: `products/${media.id}/${media.filename}`
        };

        const updatedMedia = await this.migrateMediaToCdn({
          id: media.id,
          cdn_url: cdnResult.url,
          cdn_key: cdnResult.key
        });

        results.push({
          id: media.id,
          success: true,
          cdn_url: cdnResult.url
        });
      } catch (error) {
        results.push({
          id: media.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // ================================
  // 私有辅助方法
  // ================================

  /**
   * 验证媒体文件
   */
  private validateMediaFile(file: any, type: MediaType) {
    const maxSizes = {
      IMAGE: 5 * 1024 * 1024, // 5MB
      VIDEO: 50 * 1024 * 1024  // 50MB
    };

    const allowedMimeTypes = {
      IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      VIDEO: ['video/mp4', 'video/webm', 'video/quicktime']
    };

    // 检查文件大小
    if (file.size > maxSizes[type]) {
      throw new BadRequestException(
        `${type === 'IMAGE' ? '图片' : '视频'}文件大小不能超过 ${maxSizes[type] / 1024 / 1024}MB`
      );
    }

    // 检查文件类型
    if (!allowedMimeTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(
        `不支持的${type === 'IMAGE' ? '图片' : '视频'}格式: ${file.mimetype}`
      );
    }
  }

  /**
   * 提取媒体文件元数据
   */
  private async extractMediaMetadata(file: any, filePath: string) {
    const metadata: any = {};

    if (file.mimetype.startsWith('image/')) {
      // TODO: 使用 sharp 或其他库提取图片尺寸
      // const imageInfo = await sharp(filePath).metadata();
      // metadata.width = imageInfo.width;
      // metadata.height = imageInfo.height;
      
      // 临时模拟数据
      metadata.width = 800;
      metadata.height = 600;
    } else if (file.mimetype.startsWith('video/')) {
      // TODO: 使用 ffmpeg 或其他库提取视频信息和生成缩略图
      // const videoInfo = await ffprobe(filePath);
      // metadata.width = videoInfo.streams[0].width;
      // metadata.height = videoInfo.streams[0].height;
      // metadata.duration = Math.floor(videoInfo.format.duration);
      // metadata.thumbnailPath = await generateVideoThumbnail(filePath);
      
      // 临时模拟数据
      metadata.width = 1920;
      metadata.height = 1080;
      metadata.duration = 30;
      metadata.thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');
    }

    return metadata;
  }

  /**
   * 获取媒体文件访问URL
   */
  private getMediaUrl(media: any): string {
    if (media.storage_type === StorageType.CDN && media.cdn_url) {
      return media.cdn_url;
    } else if (media.storage_type === StorageType.LOCAL && media.local_path) {
      // 返回本地文件的访问URL
      return `/uploads/${path.basename(media.local_path)}`;
    }
    return '';
  }

  /**
   * 获取缩略图URL
   */
  private getThumbnailUrl(media: any): string {
    if (media.type === 'IMAGE') {
      return this.getMediaUrl(media); // 图片本身就是缩略图
    }

    if (media.storage_type === StorageType.CDN && media.thumbnail_cdn) {
      return media.thumbnail_cdn;
    } else if (media.storage_type === StorageType.LOCAL && media.thumbnail_local) {
      return `/uploads/${path.basename(media.thumbnail_local)}`;
    }
    
    return '';
  }
}

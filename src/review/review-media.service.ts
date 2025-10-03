import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from 'shared/services/prisma.service';
import { UploadService } from 'shared/services/upload/upload.service';
import { 
  ReviewMediaUploadDto, ReviewMediaDeleteDto, ReviewMediaUpdateDto
} from './review.dto';
import { MediaType, StorageType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ReviewMediaService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  // ================================
  // 媒体文件上传相关方法
  // ================================

  /**
   * 上传评论媒体文件
   */
  async uploadReviewMedia(file: any, data: Omit<ReviewMediaUploadDto, 'file'>, userId: number) {
    const { review_id, type, sort_order } = data;

    // 验证评论是否存在且属于当前用户
    const review = await this.prisma.productReview.findFirst({
      where: { 
        id: review_id,
        user_id: userId,
        deleted_at: null
      },
      include: {
        media: true
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在或无权限操作');
    }

    // 检查媒体文件数量限制
    const currentMediaCount = review.media.length;
    const limits = {
      IMAGE: 9,  // 最多9张图片
      VIDEO: 3   // 最多3个视频
    };

    const currentTypeCount = review.media.filter(m => m.type === type).length;
    if (currentTypeCount >= limits[type]) {
      throw new BadRequestException(`最多只能上传${limits[type]}个${type === 'IMAGE' ? '图片' : '视频'}文件`);
    }

    // 验证文件类型和大小
    this.validateMediaFile(file, type);

    // 上传文件到本地存储
    const uploadResult = await this.uploadService.upload(file);

    // 获取文件元数据
    const mediaMetadata = await this.extractMediaMetadata(file, uploadResult);

    // 验证视频时长（如果是视频）
    if (type === 'VIDEO' && mediaMetadata.duration > 60) {
      // 删除已上传的文件
      try {
        await fs.unlink(uploadResult);
      } catch (error) {
        console.error('删除文件失败:', error);
      }
      throw new BadRequestException('视频时长不能超过60秒');
    }

    // 保存媒体记录到数据库
    const mediaRecord = await this.prisma.reviewMedia.create({
      data: {
        review_id,
        type,
        storage_type: StorageType.LOCAL,
        local_path: uploadResult,
        filename: file.originalname,
        file_size: BigInt(file.size),
        mime_type: file.mimetype,
        width: mediaMetadata.width,
        height: mediaMetadata.height,
        duration: mediaMetadata.duration,
        thumbnail_local: mediaMetadata.thumbnailPath,
        sort_order: sort_order || currentMediaCount
      }
    });

    return {
      id: mediaRecord.id,
      url: this.getMediaUrl(mediaRecord),
      thumbnail_url: this.getThumbnailUrl(mediaRecord),
      type: mediaRecord.type,
      file_size: Number(mediaRecord.file_size),
      sort_order: mediaRecord.sort_order
    };
  }

  /**
   * 批量上传评论媒体文件
   */
  async batchUploadReviewMedia(
    files: any[], 
    reviewId: number, 
    type: MediaType,
    userId: number
  ) {
    // 验证评论所有权
    const review = await this.prisma.productReview.findFirst({
      where: { 
        id: reviewId,
        user_id: userId,
        deleted_at: null
      },
      include: {
        media: true
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在或无权限操作');
    }

    // 检查总数量限制
    const limits = {
      IMAGE: 9,
      VIDEO: 3
    };

    const currentTypeCount = review.media.filter(m => m.type === type).length;
    const remainingSlots = limits[type] - currentTypeCount;

    if (files.length > remainingSlots) {
      throw new BadRequestException(`最多还能上传${remainingSlots}个${type === 'IMAGE' ? '图片' : '视频'}文件`);
    }

    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadReviewMedia(file, {
          review_id: reviewId,
          type,
          sort_order: currentTypeCount + i
        }, userId);
        results.push(result);
      } catch (error) {
        console.error(`上传文件 ${file.originalname} 失败:`, error);
        results.push({
          filename: file.originalname,
          success: false,
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
  async updateReviewMedia(data: ReviewMediaUpdateDto, userId: number) {
    const { id, sort_order } = data;

    // 验证媒体文件是否存在且属于当前用户
    const media = await this.prisma.reviewMedia.findFirst({
      where: { id },
      include: {
        review: {
          select: { user_id: true }
        }
      }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    if (media.review.user_id !== userId) {
      throw new ForbiddenException('无权限操作此媒体文件');
    }

    return await this.prisma.reviewMedia.update({
      where: { id },
      data: {
        sort_order
      }
    });
  }

  /**
   * 删除媒体文件
   */
  async deleteReviewMedia(data: ReviewMediaDeleteDto, userId: number) {
    const { id } = data;

    // 验证媒体文件是否存在且属于当前用户
    const media = await this.prisma.reviewMedia.findFirst({
      where: { id },
      include: {
        review: {
          select: { user_id: true }
        }
      }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    if (media.review.user_id !== userId) {
      throw new ForbiddenException('无权限操作此媒体文件');
    }

    // 删除数据库记录
    await this.prisma.reviewMedia.delete({
      where: { id }
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
   * 获取评论的所有媒体文件
   */
  async getReviewMedia(reviewId: number, userId?: number) {
    // 如果提供了userId，验证是否为评论作者（用于编辑时获取）
    if (userId) {
      const review = await this.prisma.productReview.findFirst({
        where: { 
          id: reviewId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!review) {
        throw new NotFoundException('评论不存在或无权限查看');
      }
    }

    const media = await this.prisma.reviewMedia.findMany({
      where: { review_id: reviewId },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ]
    });

    return media.map(item => ({
      ...item,
      file_size: Number(item.file_size),
      url: this.getMediaUrl(item),
      thumbnail_url: this.getThumbnailUrl(item)
    }));
  }

  // ================================
  // 管理员方法
  // ================================

  /**
   * 管理员删除媒体文件
   */
  async adminDeleteReviewMedia(mediaId: number, adminId: number) {
    const media = await this.prisma.reviewMedia.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 删除数据库记录
    await this.prisma.reviewMedia.delete({
      where: { id: mediaId }
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

  // ================================
  // 私有辅助方法
  // ================================

  /**
   * 验证媒体文件
   */
  private validateMediaFile(file: any, type: MediaType) {
    const maxSizes = {
      IMAGE: 5 * 1024 * 1024,  // 5MB
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

    // 检查文件名安全性
    const filename = file.originalname;
    if (!filename || /[<>:"/\\|?*]/.test(filename)) {
      throw new BadRequestException('文件名包含非法字符');
    }

    // 检查文件扩展名
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = {
      IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      VIDEO: ['.mp4', '.webm', '.mov']
    };

    if (!allowedExtensions[type].includes(ext)) {
      throw new BadRequestException(`不支持的文件扩展名: ${ext}`);
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
      metadata.width = 1280;
      metadata.height = 720;
      metadata.duration = 30; // 30秒
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
      return `/uploads/${path.basename(media.local_path)}`;
    }
    return '';
  }

  /**
   * 获取缩略图URL
   */
  private getThumbnailUrl(media: any): string {
    if (media.type === 'IMAGE') {
      return this.getMediaUrl(media);
    }

    if (media.storage_type === StorageType.CDN && media.thumbnail_cdn) {
      return media.thumbnail_cdn;
    } else if (media.storage_type === StorageType.LOCAL && media.thumbnail_local) {
      return `/uploads/${path.basename(media.thumbnail_local)}`;
    }
    
    return '';
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { MediaManagementService } from 'shared/services/media/media-management.service';
import { 
  ReviewMediaUploadDto, ReviewMediaDeleteDto, ReviewMediaUpdateDto
} from '../review.dto';
import { MediaType } from '@prisma/client';

@Injectable()
export class ReviewMediaService {
  constructor(
    private prisma: PrismaService,
    private mediaManagementService: MediaManagementService
  ) {}

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

    // 使用统一媒体管理服务上传
    const mediaResult = await this.mediaManagementService.uploadMedia({
      file,
      businessType: 'REVIEW',
      businessId: review_id,
      type: type,
      sortOrder: sort_order || 0,
      category: 'GENERAL'
    });

    // 验证视频时长（如果是视频）
    if (type === 'VIDEO' && mediaResult.duration && mediaResult.duration > 60) {
      // 删除已上传的媒体记录
      await this.mediaManagementService.deleteMedia(mediaResult.id);
      throw new BadRequestException('视频时长不能超过60秒');
    }

    return {
      success: true,
      data: {
        id: mediaResult.id,
        url: mediaResult.url,
        thumbnail_url: mediaResult.thumbnail_url,
        filename: mediaResult.filename,
        file_size: mediaResult.file_size,
        mime_type: mediaResult.mime_type,
        width: mediaResult.width,
        height: mediaResult.height,
        duration: mediaResult.duration,
        sort_order: mediaResult.sort_order,
        created_at: mediaResult.created_at
      }
    };
  }

  /**
   * 批量上传评论媒体文件
   */
  async batchUploadReviewMedia(files: any[], reviewId: number, userId: number) {
    // 验证评论是否存在且属于当前用户
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

    // 检查媒体文件数量限制
    const currentMediaCount = review.media.length;
    const maxTotalMedia = 9; // 评论最多9个媒体文件

    if (currentMediaCount + files.length > maxTotalMedia) {
      throw new BadRequestException(`评论最多只能上传${maxTotalMedia}个媒体文件，当前已有${currentMediaCount}个`);
    }

    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 自动判断文件类型
        const type = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';
        
        // 验证文件类型和大小
        this.validateMediaFile(file, type);

        const mediaResult = await this.mediaManagementService.uploadMedia({
          file,
          businessType: 'REVIEW',
          businessId: reviewId,
          type: type,
          sortOrder: i,
          category: 'GENERAL'
        });

        // 验证视频时长（如果是视频）
        if (type === 'VIDEO' && mediaResult.duration && mediaResult.duration > 60) {
          await this.mediaManagementService.deleteMedia(mediaResult.id);
          throw new BadRequestException('视频时长不能超过60秒');
        }

        results.push({
          success: true,
          data: {
            id: mediaResult.id,
            url: mediaResult.url,
            thumbnail_url: mediaResult.thumbnail_url,
            filename: mediaResult.filename,
            file_size: mediaResult.file_size,
            mime_type: mediaResult.mime_type,
            width: mediaResult.width,
            height: mediaResult.height,
            duration: mediaResult.duration,
            sort_order: i,
            created_at: mediaResult.created_at
          }
        });
      } catch (error) {
        results.push({
          success: false,
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 更新媒体文件信息
   */
  async updateReviewMedia(data: ReviewMediaUpdateDto, userId: number) {
    // 验证媒体文件是否存在且属于当前用户
    const media = await this.prisma.media.findFirst({
      where: { 
        id: data.id,
        business_type: 'REVIEW',
        user_id: userId
      }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在或无权限操作');
    }

    return await this.mediaManagementService.updateMedia(data.id, {
      sort_order: data.sort_order
    });
  }

  /**
   * 删除媒体文件
   */
  async deleteReviewMedia(data: ReviewMediaDeleteDto, userId: number) {
    // 验证媒体文件是否存在且属于当前用户
    const media = await this.prisma.media.findFirst({
      where: { 
        id: data.id,
        business_type: 'REVIEW',
        user_id: userId
      }
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在或无权限操作');
    }

    return await this.mediaManagementService.deleteMedia(data.id);
  }

  /**
   * 获取评论的所有媒体文件
   */
  async getReviewMedia(reviewId: number) {
    const mediaList = await this.mediaManagementService.getMediaList({
      businessType: 'REVIEW',
      businessId: reviewId,
      page: 1,
      pageSize: 100
    });

    // 按排序权重排序
    const sortedMedia = mediaList.records.sort((a, b) => a.sort_order - b.sort_order);

    return sortedMedia.map(item => ({
      id: item.id,
      url: item.url,
      thumbnail_url: item.thumbnail_url,
      filename: item.filename,
      file_size: item.file_size,
      mime_type: item.mime_type,
      width: item.width,
      height: item.height,
      duration: item.duration,
      sort_order: item.sort_order,
      created_at: item.created_at
    }));
  }

  /**
   * 获取评论媒体统计信息
   */
  async getReviewMediaStats(reviewId: number) {
    const stats = await this.prisma.media.groupBy({
      by: ['type'],
      where: {
        business_type: 'REVIEW',
        business_id: reviewId
      },
      _count: {
        id: true
      }
    });

    const result = {
      total: 0,
      by_type: {
        IMAGE: 0,
        VIDEO: 0
      }
    };

    stats.forEach(stat => {
      result.total += stat._count.id;
      result.by_type[stat.type] += stat._count.id;
    });

    return result;
  }

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
}

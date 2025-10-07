import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { MediaManagementService } from 'shared/services/media/media-management.service';
import { 
  ProductMediaUploadDto, ProductMediaUpdateDto, ProductMediaDeleteDto,
  ProductMediaUploadOrderDto
} from '../dtos';
import { MediaType } from '@prisma/client';

@Injectable()
export class ProductMediaService {
  constructor(
    private prisma: PrismaService,
    private mediaManagementService: MediaManagementService
  ) {}

  /**
   * 上传产品媒体文件
   */
  async uploadProductMedia(file: any, data: ProductMediaUploadOrderDto) {
    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: data.product_id, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 验证文件类型和大小
    this.validateMediaFile(file, data.type);

    // 使用统一媒体管理服务上传
    const mediaResult = await this.mediaManagementService.uploadMedia({
      file,
      businessType: 'PRODUCT',
      businessId: data.product_id,
      type: data.type,
      altText: data.alt_text,
      sortOrder: data.sort_order || 0,
      category: data.media_category || 'MAIN'
    });

    return {
      id: mediaResult.id,
      url: mediaResult.url,
      thumbnail_url: mediaResult.thumbnail_url,
      filename: mediaResult.filename,
      file_size: mediaResult.file_size,
      mime_type: mediaResult.mime_type,
      width: mediaResult.width,
      height: mediaResult.height,
      duration: mediaResult.duration,
      alt_text: mediaResult.alt_text,
      sort_order: mediaResult.sort_order,
      media_category: data.media_category || 'MAIN',
      created_at: mediaResult.created_at
    };
  }

  /**
   * 批量上传产品媒体文件
   */
  async batchUploadProductMedia(files: any[], data: ProductMediaUploadOrderDto) {
    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: data.product_id, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 验证文件类型和大小
        this.validateMediaFile(file, data.type);

        const mediaResult = await this.mediaManagementService.uploadMedia({
          file,
          businessType: 'PRODUCT',
          businessId: data.product_id,
          type: data.type,
          sortOrder: i,
          category: data.media_category || 'GALLERY'
        });

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
            media_category: 'GALLERY',
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
  async updateProductMedia(data: ProductMediaUpdateDto) {
    return await this.mediaManagementService.updateMedia(data.id, {
      alt_text: data.alt_text,
      sort_order: data.sort_order,
      category: data.media_category
    });
  }

  /**
   * 删除媒体文件
   */
  async deleteProductMedia(data: ProductMediaDeleteDto) {
    return await this.mediaManagementService.deleteMedia(data.id);
  }

  /**
   * 获取产品的所有媒体文件
   */
  async getProductMedia(productId: number) {
    const mediaList = await this.mediaManagementService.getMediaList({
      businessType: 'PRODUCT',
      businessId: productId,
      page: 1,
      pageSize: 100
    });

    // 按媒体分类和排序权重排序
    const sortedMedia = mediaList.records.sort((a, b) => {
      // 先按媒体分类排序
      const categoryOrder = { 'MAIN': 1, 'GALLERY': 2, 'DETAIL': 3 };
      const categoryA = categoryOrder[a.category] || 999;
      const categoryB = categoryOrder[b.category] || 999;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      // 再按排序权重排序
      return a.sort_order - b.sort_order;
    });

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
      alt_text: item.alt_text,
      sort_order: item.sort_order,
      media_category: item.category,
      created_at: item.created_at
    }));
  }

  /**
   * 设置产品主图
   */
  async setProductMainImage(productId: number, mediaId: number) {
    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 验证媒体文件是否存在且属于该产品
    const media = await this.prisma.media.findFirst({
      where: { 
        id: mediaId,
        business_type: 'PRODUCT',
        business_id: productId,
        type: 'IMAGE'
      }
    });
    if (!media) {
      throw new NotFoundException('媒体文件不存在或不属于该产品');
    }

    // 获取媒体URL
    const mediaUrl = this.mediaManagementService.getMediaUrl(media);

    // 更新产品主图
    await this.prisma.product.update({
      where: { id: productId },
      data: { 
        updated_at: new Date()
      }
    });

    // 更新媒体分类为主图
    await this.mediaManagementService.updateMedia(mediaId, {
      category: 'MAIN'
    });

    return {
      product_id: productId,
      main_image: mediaUrl,
      media_id: mediaId
    }
  }

  /**
   * 获取产品媒体统计信息
   */
  async getProductMediaStats(productId: number) {
    const stats = await this.prisma.media.groupBy({
      by: ['type', 'category'],
      where: {
        business_type: 'PRODUCT',
        business_id: productId
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
      },
      by_category: {
        MAIN: 0,
        GALLERY: 0,
        DETAIL: 0
      }
    };

    stats.forEach(stat => {
      result.total += stat._count.id;
      result.by_type[stat.type] += stat._count.id;
      result.by_category[stat.category] += stat._count.id;
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

  /**
   * 根据ID获取单个媒体文件信息
   */
  async getProductMediaById(mediaId: number) {
    const media = await this.mediaManagementService.getMediaById(mediaId);
    
    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 检查是否为产品媒体
    if (media.business_type !== 'PRODUCT') {
      throw new BadRequestException('该媒体文件不属于产品');
    }

    return {
      id: media.id,
      url: this.mediaManagementService.getMediaUrl(media),
      thumbnail_url: this.mediaManagementService.getThumbnailUrl(media),
      filename: media.filename,
      file_size: media.file_size?.toString(),
      mime_type: media.mime_type,
      width: media.width,
      height: media.height,
      duration: media.duration,
      alt_text: media.alt_text,
      sort_order: media.sort_order,
      category: media.category,
      created_at: media.created_at,
      updated_at: media.updated_at
    }
  }
}

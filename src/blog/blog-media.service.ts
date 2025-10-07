import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { MediaManagementService } from 'shared/services/media/media-management.service';
import { MediaType } from '@prisma/client';

export interface BlogMediaUploadDto {
  blog_id: number;
  type: MediaType;
  alt_text?: string;
  sort_order?: number;
  category?: string;
}

@Injectable()
export class BlogMediaService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaManagementService
  ) {}

  /**
   * 上传博客媒体文件
   */
  async uploadBlogMedia(file: any, data: BlogMediaUploadDto, userId: number) {
    // 验证博客是否存在
    const blog = await this.prisma.blog.findFirst({
      where: { id: data.blog_id }
    });
    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    // 使用统一的媒体管理服务上传
    return this.mediaService.uploadMedia({
      file,
      businessType: 'BLOG',
      businessId: data.blog_id,
      type: data.type,
      altText: data.alt_text,
      sortOrder: data.sort_order,
      category: data.category || 'DEFAULT',
      userId
    });
  }

  /**
   * 批量上传博客媒体文件
   */
  async batchUploadBlogMedia(files: any[], blogId: number, type: MediaType, userId: number) {
    // 验证博客是否存在
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId }
    });
    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    return this.mediaService.batchUploadMedia(files, {
      businessType: 'BLOG',
      businessId: blogId,
      type,
      category: 'DEFAULT',
      userId
    });
  }

  /**
   * 获取博客的媒体列表
   */
  async getBlogMediaList(blogId: number, params: {
    type?: MediaType;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    // 验证博客是否存在
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId }
    });
    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    return this.mediaService.getMediaList({
      businessType: 'BLOG',
      businessId: blogId,
      type: params.type,
      category: params.category,
      page: params.page,
      pageSize: params.pageSize
    });
  }

  /**
   * 更新博客媒体信息
   */
  async updateBlogMedia(mediaId: number, data: {
    alt_text?: string;
    sort_order?: number;
    category?: string;
  }, userId: number) {
    // 验证媒体是否属于博客
    const media = await this.prisma.media.findFirst({
      where: { 
        id: mediaId, 
        business_type: 'BLOG',
        user_id: userId
      }
    });
    if (!media) {
      throw new NotFoundException('媒体文件不存在或无权限操作');
    }

    return this.mediaService.updateMedia(mediaId, data, userId);
  }

  /**
   * 删除博客媒体文件
   */
  async deleteBlogMedia(mediaId: number, userId: number) {
    // 验证媒体是否属于博客
    const media = await this.prisma.media.findFirst({
      where: { 
        id: mediaId, 
        business_type: 'BLOG',
        user_id: userId
      }
    });
    if (!media) {
      throw new NotFoundException('媒体文件不存在或无权限操作');
    }

    return this.mediaService.deleteMedia(mediaId, userId);
  }

  /**
   * 获取博客封面图片
   */
  async getBlogCoverImage(blogId: number) {
    const result = await this.mediaService.getMediaList({
      businessType: 'BLOG',
      businessId: blogId,
      type: 'IMAGE',
      category: 'COVER',
      page: 1,
      pageSize: 1
    });

    return result.records.length > 0 ? result.records[0] : null;
  }

  /**
   * 设置博客封面图片
   */
  async setBlogCoverImage(blogId: number, mediaId: number, userId: number) {
    // 验证媒体是否属于该博客
    const media = await this.prisma.media.findFirst({
      where: { 
        id: mediaId, 
        business_type: 'BLOG',
        business_id: blogId,
        user_id: userId
      }
    });
    if (!media) {
      throw new NotFoundException('媒体文件不存在或无权限操作');
    }

    // 更新媒体分类为封面
    await this.mediaService.updateMedia(mediaId, { category: 'COVER' }, userId);

    // 更新博客的封面图片字段
    await this.prisma.blog.update({
      where: { id: blogId },
      data: { cover_image: media.local_path }
    });

    return { message: '封面图片设置成功' };
  }
}

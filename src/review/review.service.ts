import { 
  Injectable, NotFoundException, BadRequestException, 
  ForbiddenException, UnauthorizedException 
} from "@nestjs/common";
import { PrismaService } from 'shared/services/prisma.service';
import { 
  ReviewListDto, ReviewCreateDto, ReviewUpdateDto, ReviewDetailDto,
  ReviewHelpfulVoteDto, ReviewModerationDto, ReviewBatchModerationDto,
  AdminReviewListDto, ReviewDeleteDto, ReviewReportDto, ReviewStatsDto
} from './review.dto';
import { ReviewStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // 公开查询方法
  // ================================

  /**
   * 获取产品评论列表（公开接口）
   */
  async getReviewList(query: ReviewListDto) {
    const { 
      page, page_size, product_id, rating, status, 
      has_media, sort_by 
    } = query;

    // 构建安全的查询条件
    const where: Prisma.ProductReviewWhereInput = {
      product_id,
      status: ReviewStatus.APPROVED, // 只显示已审核通过的评论
      is_visible: true,
      deleted_at: null
    };

    // 评分筛选
    if (rating) {
      where.rating = rating;
    }

    // 媒体文件筛选
    if (has_media !== undefined) {
      if (has_media) {
        where.media = { some: {} };
      } else {
        where.media = { none: {} };
      }
    }

    // 构建排序条件
    const orderBy: Prisma.ProductReviewOrderByWithRelationInput[] = [];
    switch (sort_by) {
      case 'newest':
        orderBy.push({ created_at: 'desc' });
        break;
      case 'oldest':
        orderBy.push({ created_at: 'asc' });
        break;
      case 'helpful':
        orderBy.push({ helpful_count: 'desc' });
        break;
      case 'rating_high':
        orderBy.push({ rating: 'desc' });
        break;
      case 'rating_low':
        orderBy.push({ rating: 'asc' });
        break;
      default:
        orderBy.push({ helpful_count: 'desc' }, { created_at: 'desc' });
    }

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        skip: (page - 1) * page_size,
        take: page_size,
        where,
        orderBy,
        include: {
          user: {
            select: { 
              id: true, 
              username: true, 
              avatar_url: true 
            }
          },
          media: {
            orderBy: { sort_order: 'asc' },
            select: {
              id: true,
              type: true,
              storage_type: true,
              local_path: true,
              cdn_url: true,
              thumbnail_local: true,
              thumbnail_cdn: true,
              sort_order: true
            }
          },
          replies: {
            where: {
              status: 'APPROVED',
              is_visible: true,
              deleted_at: null
            },
            orderBy: { created_at: 'asc' },
            take: 3, // 只显示前3条回复
            include: {
              user: {
                select: { 
                  id: true, 
                  username: true, 
                  avatar_url: true 
                }
              }
            }
          }
        }
      }),
      this.prisma.productReview.count({ where })
    ]);

    return {
      records: reviews.map(review => ({
        ...review,
        media: review.media.map(media => ({
          ...media,
          url: this.getMediaUrl(media),
          thumbnail_url: this.getThumbnailUrl(media)
        }))
      })),
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    };
  }

  /**
   * 获取评论详情
   */
  async getReviewDetail(query: ReviewDetailDto) {
    const review = await this.prisma.productReview.findFirst({
      where: { 
        id: query.id,
        status: 'APPROVED',
        is_visible: true,
        deleted_at: null
      },
      include: {
        user: {
          select: { 
            id: true, 
            username: true, 
            avatar_url: true 
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        },
        media: {
          orderBy: { sort_order: 'asc' }
        },
        replies: {
          where: {
            status: 'APPROVED',
            is_visible: true,
            deleted_at: null
          },
          orderBy: { created_at: 'asc' },
          include: {
            user: {
              select: { 
                id: true, 
                username: true, 
                avatar_url: true 
              }
            }
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在');
    }

    return {
      ...review,
      media: review.media.map(media => ({
        ...media,
        url: this.getMediaUrl(media),
        thumbnail_url: this.getThumbnailUrl(media)
      }))
    };
  }

  /**
   * 获取产品评论统计
   */
  async getReviewStats(query: ReviewStatsDto) {
    const { product_id } = query;

    const [
      totalReviews,
      averageRating,
      ratingDistribution
    ] = await Promise.all([
      // 总评论数
      this.prisma.productReview.count({
        where: {
          product_id,
          status: 'APPROVED',
          is_visible: true,
          deleted_at: null
        }
      }),
      // 平均评分
      this.prisma.productReview.aggregate({
        where: {
          product_id,
          status: 'APPROVED',
          is_visible: true,
          deleted_at: null
        },
        _avg: { rating: true }
      }),
      // 评分分布
      this.prisma.productReview.groupBy({
        by: ['rating'],
        where: {
          product_id,
          status: 'APPROVED',
          is_visible: true,
          deleted_at: null
        },
        _count: { rating: true },
        orderBy: { rating: 'desc' }
      })
    ]);

    return {
      total_reviews: totalReviews,
      average_rating: averageRating._avg.rating || 0,
      rating_distribution: ratingDistribution.map(item => ({
        rating: item.rating,
        count: item._count.rating
      }))
    };
  }

  // ================================
  // 用户操作方法（需要登录）
  // ================================

  /**
   * 创建评论（需要验证购买记录）
   */
  async createReview(data: ReviewCreateDto, userId: number) {
    const { product_id, order_id, rating, content, parent_id } = data;

    // 验证产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: product_id, deleted_at: null }
    });
    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 验证订单是否存在且属于当前用户
    const order = await this.prisma.order.findFirst({
      where: {
        id: order_id,
        user_id: userId,
        status: 'COMPLETED' // 只有已完成的订单才能评论
      },
      include: {
        items: {
          where: { product_id },
          select: { id: true }
        }
      }
    });

    if (!order) {
      throw new BadRequestException('订单不存在或未完成');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('该订单中没有此产品');
    }

    // 检查是否已经评论过
    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        product_id,
        user_id: userId,
        order_id,
        deleted_at: null
      }
    });

    if (existingReview) {
      throw new BadRequestException('您已经对此产品进行过评论');
    }

    // 如果是回复，验证父评论
    if (parent_id) {
      const parentReview = await this.prisma.productReview.findFirst({
        where: {
          id: parent_id,
          product_id,
          status: 'APPROVED',
          deleted_at: null
        }
      });

      if (!parentReview) {
        throw new BadRequestException('父评论不存在');
      }
    }

    // 内容安全检查
    const sanitizedContent = this.sanitizeContent(content);
    if (!sanitizedContent || sanitizedContent.length < 10) {
      throw new BadRequestException('评论内容过短或包含非法字符');
    }

    // 创建评论
    const review = await this.prisma.productReview.create({
      data: {
        product_id,
        user_id: userId,
        order_id,
        rating,
        content: sanitizedContent,
        parent_id,
        status: 'PENDING' // 默认待审核
      },
      include: {
        user: {
          select: { 
            id: true, 
            username: true, 
            avatar_url: true 
          }
        }
      }
    });

    return review;
  }

  /**
   * 更新评论（只能更新自己的评论）
   */
  async updateReview(data: ReviewUpdateDto, userId: number) {
    const { id, rating, content } = data;

    // 查找评论并验证所有权
    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        id,
        user_id: userId,
        deleted_at: null
      }
    });

    if (!existingReview) {
      throw new NotFoundException('评论不存在或无权限修改');
    }

    // 只能修改待审核或已拒绝的评论
    if (existingReview.status === 'APPROVED') {
      throw new BadRequestException('已审核通过的评论无法修改');
    }

    // 内容安全检查
    const updateData: any = {};
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    if (content !== undefined) {
      const sanitizedContent = this.sanitizeContent(content);
      if (!sanitizedContent || sanitizedContent.length < 10) {
        throw new BadRequestException('评论内容过短或包含非法字符');
      }
      updateData.content = sanitizedContent;
    }

    // 重新设为待审核状态
    updateData.status = 'PENDING';
    updateData.updated_at = new Date();

    return await this.prisma.productReview.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { 
            id: true, 
            username: true, 
            avatar_url: true 
          }
        }
      }
    });
  }

  /**
   * 删除评论（软删除，只能删除自己的评论）
   */
  async deleteReview(data: ReviewDeleteDto, userId: number) {
    const { id, delete_reason } = data;

    const review = await this.prisma.productReview.findFirst({
      where: {
        id,
        user_id: userId,
        deleted_at: null
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在或无权限删除');
    }

    return await this.prisma.productReview.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_visible: false,
        // 可以记录删除原因
        ...(delete_reason && { 
          content: `[用户删除: ${delete_reason}] ${review.content}` 
        })
      }
    });
  }

  /**
   * 评论有用性投票
   */
  async voteReviewHelpful(data: ReviewHelpfulVoteDto, userId: number) {
    const { review_id, is_helpful } = data;

    // 验证评论是否存在
    const review = await this.prisma.productReview.findFirst({
      where: {
        id: review_id,
        status: 'APPROVED',
        is_visible: true,
        deleted_at: null
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在');
    }

    // 不能给自己的评论投票
    if (review.user_id === userId) {
      throw new BadRequestException('不能给自己的评论投票');
    }

    // 使用事务处理投票
    return await this.prisma.$transaction(async (tx) => {
      // 创建或更新投票记录
      await tx.reviewHelpfulVote.upsert({
        where: {
          review_id_user_id: {
            review_id,
            user_id: userId
          }
        },
        create: {
          review_id,
          user_id: userId,
          is_helpful
        },
        update: {
          is_helpful,
          updated_at: new Date()
        }
      });

      // 重新计算有用数
      const helpfulCount = await tx.reviewHelpfulVote.count({
        where: {
          review_id,
          is_helpful: true
        }
      });

      // 更新评论的有用数
      await tx.productReview.update({
        where: { id: review_id },
        data: { helpful_count: helpfulCount }
      });

      return { helpful_count: helpfulCount };
    });
  }

  /**
   * 举报评论
   */
  async reportReview(data: ReviewReportDto, userId: number) {
    const { review_id, reason, description } = data;

    // 验证评论是否存在
    const review = await this.prisma.productReview.findFirst({
      where: {
        id: review_id,
        deleted_at: null
      }
    });

    if (!review) {
      throw new NotFoundException('评论不存在');
    }

    // 不能举报自己的评论
    if (review.user_id === userId) {
      throw new BadRequestException('不能举报自己的评论');
    }

    // TODO: 检查是否已经举报过（需要创建 ReviewReport 表）
    // const existingReport = await this.prisma.reviewReport?.findFirst({
    //   where: {
    //     review_id,
    //     reporter_id: userId
    //   }
    // });

    // if (existingReport) {
    //   throw new BadRequestException('您已经举报过此评论');
    // }

    // 创建举报记录（需要先在数据库中创建 ReviewReport 表）
    // 这里先返回成功，实际项目中需要创建相应的表
    return {
      success: true,
      message: '举报已提交，我们会尽快处理'
    };
  }

  // ================================
  // 管理员方法
  // ================================

  /**
   * 管理员获取评论列表
   */
  async getAdminReviewList(query: AdminReviewListDto) {
    const { 
      page, page_size, product_id, user_id, status, 
      rating, keyword, date_from, date_to 
    } = query;

    const where: Prisma.ProductReviewWhereInput = {};

    if (product_id) where.product_id = product_id;
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;
    if (rating) where.rating = rating;

    // 关键词搜索（已在DTO中进行了安全处理）
    if (keyword) {
      where.OR = [
        { content: { contains: keyword, mode: 'insensitive' } },
        { user: { username: { contains: keyword, mode: 'insensitive' } } }
      ];
    }

    // 日期范围筛选
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z');
    }

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        skip: (page - 1) * page_size,
        take: page_size,
        where,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { 
              id: true, 
              username: true, 
              email: true,
              avatar_url: true 
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          },
          order: {
            select: {
              id: true,
              order_number: true
            }
          },
          media: {
            select: {
              id: true,
              type: true,
              storage_type: true
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      }),
      this.prisma.productReview.count({ where })
    ]);

    return {
      records: reviews,
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    };
  }

  /**
   * 审核评论
   */
  async moderateReview(data: ReviewModerationDto, adminId: number) {
    const { id, status, moderation_note } = data;

    const review = await this.prisma.productReview.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('评论不存在');
    }

    return await this.prisma.productReview.update({
      where: { id },
      data: {
        status,
        is_visible: status === 'APPROVED',
        // 可以记录审核信息
        updated_at: new Date()
      }
    });
  }

  /**
   * 批量审核评论
   */
  async batchModerateReviews(data: ReviewBatchModerationDto, adminId: number) {
    const { ids, status, moderation_note } = data;

    return await this.prisma.productReview.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status,
        is_visible: status === 'APPROVED',
        updated_at: new Date()
      }
    });
  }

  // ================================
  // 私有辅助方法
  // ================================

  /**
   * 内容安全处理
   */
  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // 去除HTML标签
    let sanitized = content.replace(/<[^>]*>/g, '');
    
    // 去除危险字符
    sanitized = sanitized.replace(/[<>'"%;()&+]/g, '');
    
    // 去除多余空白
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // 限制长度
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000);
    }

    return sanitized;
  }

  /**
   * 获取媒体文件URL
   */
  private getMediaUrl(media: any): string {
    if (media.storage_type === 'CDN' && media.cdn_url) {
      return media.cdn_url;
    } else if (media.storage_type === 'LOCAL' && media.local_path) {
      return `/uploads/${media.local_path.split('/').pop()}`;
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

    if (media.storage_type === 'CDN' && media.thumbnail_cdn) {
      return media.thumbnail_cdn;
    } else if (media.storage_type === 'LOCAL' && media.thumbnail_local) {
      return `/uploads/${media.thumbnail_local.split('/').pop()}`;
    }
    
    return '';
  }
}

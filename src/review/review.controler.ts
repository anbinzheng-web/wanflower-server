import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ReviewCreateDto, ReviewListDto, ProductReviewUploadImageDto, ProductReviewDeleteImageDto } from './review.dto';
import { PrismaService } from 'shared/services/prisma.service';
import { PaginatedData } from 'shared/dto/response.dto';
import { ByIdDto } from 'shared/dto/byId.dto';
import { UploadService } from "shared/services/upload/upload.service";
import { FileInterceptor } from '@nestjs/platform-express';
import Express from 'express';
import type { ReviewImage } from './interface';

@ApiTags('review', '商品的评论')
@Controller('review')
export class ReviewController {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  @Post('create')
  async create(@Body() body: ReviewCreateDto) {
    // TODO 创建评论
    // this.prisma.productReview.create({})
  }

  @Post('update')
  async update(@Body() body: ReviewCreateDto) {
    // TODO 更新评论
  }

  @Get('list')
  async list(@Query() query: ReviewListDto) {
    const { page, page_size, ...filter } = query;
    const [productReviewsList, productRevewsTotal] = await Promise.all([
      this.prisma.productReview.findMany({
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
        where: filter,
      }),
      this.prisma.productReview.count({
        where: filter
      })
    ])
    return new PaginatedData(productReviewsList, productRevewsTotal, page, page_size);
  }

  @Post('delete')
  async delete(@Body() body: ByIdDto) {
    await this.prisma.productReview.delete({ where: { id: body.id } })
  }

  @Post('upload_image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: ProductReviewUploadImageDto })
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() body: Omit<ProductReviewUploadImageDto, 'file'>) {
    // TODO 上传评论图片，存储到数据库中去
    // 设置最多为 9 张
    return this.uploadService.upload(file);
  }

  @Post('delete_image')
  async deleteImage(@Body() body: ProductReviewDeleteImageDto) {
    // TODO 删除评论图片
    const review = await this.prisma.productReview.findUnique({ where: { id: body.review_id } });
    if (!review) {
      throw new Error('评论不存在');
    }
    const images = (review.images || []) as ReviewImage[];
    const index = images.findIndex(img => img.name === body.filename);
    if (index === -1) {
      throw new Error('图片不存在');
    }
    images.splice(index, 1);
    await this.prisma.productReview.update({
      where: { id: body.review_id },
      data: { images }
    });
    // 同时删除存储的文件
    await this.uploadService.delete(body.filename);
  }
}
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from 'shared/services/prisma.service';
import { BlogCreateDto, BlogListDto, BlogUpdateDto, BlogSlugDto } from './blog.dto';
import { PaginatedData } from 'shared/dto/response.dto';
import { BlogService } from './blog.service';
import { ByIdDto } from 'shared/dto/byId.dto';
import { Blog } from '@prisma/client';

@ApiTags('blog', '博客相关接口')
@Controller('blog')
export class BlogController {
  constructor(private prisma: PrismaService, private blogService: BlogService) {}

  // @ApiResponse({ type:  })
  @Get('list')
  async list(@Query() query: BlogListDto) {
    const { page, page_size } = query;
    const [blogs, total] = await Promise.all([
      this.prisma.blog.findMany({
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      this.prisma.blog.count()
    ])
    return new PaginatedData(blogs, total, page, page_size);
  }

  @Post('create')
  async create(@Body() body: BlogCreateDto) {
    return this.blogService.create(body);
  }

  @Post('update')
  async update(@Body() body: BlogUpdateDto) {
    const { id, ...data } = body
    return this.prisma.blog.update({
      where: {
        id: id
      },
      data: data
    })
  }

  @Post('delete')
  async delete(@Body() body: ByIdDto) {
    return this.prisma.blog.delete({
      where: {
        id: body.id
      }
    })
  }

  @Post('slug')
  async slug(@Body() body: BlogSlugDto) {
    return this.prisma.blog.findUnique({
      where: {
        slug_language: {
          slug: body.slug,
          language: 'en'
        }
      }
    })
  }
}
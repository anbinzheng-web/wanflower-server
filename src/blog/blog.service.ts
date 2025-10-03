import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "shared/services/prisma.service";
import { BlogCreateDto, BlogUpdateDto, BlogListDto, BlogSlugDto } from "./blog.dto";
import { BlogTagCreateDto, BlogTagUpdateDto, BlogTagListDto } from "./blog.dto";
import { BlogCategoryCreateDto, BlogCategoryUpdateDto, BlogCategoryListDto } from "./blog.dto";
import slugify from 'slugify';
import pinyin from 'pinyin';
import { BlogStatus } from '@prisma/client';
import readingTime from "reading-time";
import { PaginatedData } from 'shared/dto/response.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}
  
  /**
   * 格式化 slug
   */
  async formatSlug(title: string): Promise<string> {
    const py = pinyin(title, { style: pinyin.STYLE_NORMAL }).flat().join('-');
    return slugify(py, { lower: true, strict: true });
  }

  /**
   * 检查 slug 是否唯一
   */
  async checkSlugUnique(slug: string, language: string, projectType: string, excludeId?: number): Promise<boolean> {
    const existing = await this.prisma.blog.findFirst({
      where: {
        slug,
        language,
        project_type: projectType,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    return !existing;
  }

  /**
   * 创建博客文章
   */
  async create(data: BlogCreateDto) {
    const slug = data.slug || await this.formatSlug(data.title);
    
    // 检查 slug 唯一性
    const isSlugUnique = await this.checkSlugUnique(slug, data.language || 'zh', data.project_type);
    if (!isSlugUnique) {
      throw new BadRequestException('该 slug 在当前语言和项目类型下已存在');
    }

    // 计算阅读时间
    const readingTimeResult = readingTime(data.md || '');
    
    // 创建博客文章
    const blog = await this.prisma.blog.create({
      data: {
        title: data.title,
        author: data.author || 'Anbin',
        slug: slug,
        cover_image: data.cover_image || '',
        seo: data.seo,
        md: data.md || '',
        summary: data.summary,
        language: data.language || 'zh',
        project_type: data.project_type,
        is_featured: data.is_featured || false,
        sort_order: data.sort_order || 0,
        status: BlogStatus.DRAFT,
        reading_time: Math.ceil(readingTimeResult.minutes) || 1
      },
      include: {
        tags: true,
        categories: true
      }
    });

    // 关联标签和分类
    if (data.tag_ids && data.tag_ids.length > 0) {
      await this.prisma.blog.update({
        where: { id: blog.id },
        data: {
          tags: {
            connect: data.tag_ids.map(id => ({ id }))
          }
        }
      });
    }

    if (data.category_ids && data.category_ids.length > 0) {
      await this.prisma.blog.update({
        where: { id: blog.id },
        data: {
          categories: {
            connect: data.category_ids.map(id => ({ id }))
          }
        }
      });
    }

    return this.findById(blog.id);
  }

  /**
   * 更新博客文章
   */
  async update(data: BlogUpdateDto) {
    const { id, tag_ids, category_ids, ...updateData } = data;
    const updatePayload: any = updateData;
    
    // 检查博客是否存在
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id }
    });
    
    if (!existingBlog) {
      throw new NotFoundException('博客文章不存在');
    }

    // 如果更新了 slug，检查唯一性
    if (updatePayload.slug && updatePayload.slug !== existingBlog.slug) {
      const isSlugUnique = await this.checkSlugUnique(
        updatePayload.slug, 
        updatePayload.language || existingBlog.language, 
        updatePayload.project_type || existingBlog.project_type,
        id
      );
      if (!isSlugUnique) {
        throw new BadRequestException('该 slug 在当前语言和项目类型下已存在');
      }
    }

    // 如果更新了内容，重新计算阅读时间
    if (updatePayload.md) {
      const readingTimeResult = readingTime(updatePayload.md);
      updatePayload.reading_time = Math.ceil(readingTimeResult.minutes) || 1;
    }

    // 更新博客文章
    const blog = await this.prisma.blog.update({
      where: { id },
      data: updatePayload,
      include: {
        tags: true,
        categories: true
      }
    });

    // 更新标签关联
    if (tag_ids !== undefined) {
      await this.prisma.blog.update({
        where: { id },
        data: {
          tags: {
            set: tag_ids.map(tagId => ({ id: tagId }))
          }
        }
      });
    }

    // 更新分类关联
    if (category_ids !== undefined) {
      await this.prisma.blog.update({
        where: { id },
        data: {
          categories: {
            set: category_ids.map(categoryId => ({ id: categoryId }))
          }
        }
      });
    }

    return this.findById(id);
  }

  /**
   * 根据 ID 查找博客文章
   */
  async findById(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        tags: true,
        categories: true
      }
    });

    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    return blog;
  }

  /**
   * 根据 slug 查找博客文章
   */
  async findBySlug(data: BlogSlugDto) {
    const blog = await this.prisma.blog.findFirst({
      where: {
        slug: data.slug,
        language: data.language || 'zh',
        project_type: data.project_type || 'default'
      },
      include: {
        tags: true,
        categories: true
      }
    });

    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    return blog;
  }

  /**
   * 获取博客列表
   */
  async findMany(query: BlogListDto): Promise<PaginatedData<any>> {
    const { 
      page, 
      page_size, 
      status, 
      project_type, 
      search, 
      tag_ids, 
      category_ids, 
      is_featured, 
      language,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query;

    // 构建查询条件
    const where: any = {};

    if (status) where.status = status;
    if (project_type) where.project_type = project_type;
    if (is_featured !== undefined) where.is_featured = is_featured;
    if (language) where.language = language;

    // 搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { md: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 标签过滤
    if (tag_ids && tag_ids.length > 0) {
      where.tags = {
        some: {
          id: { in: tag_ids }
        }
      };
    }

    // 分类过滤
    if (category_ids && category_ids.length > 0) {
      where.categories = {
        some: {
          id: { in: category_ids }
        }
      };
    }

    // 构建排序
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    const [blogs, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        include: {
          tags: true,
          categories: true
        },
        orderBy,
        skip: (page - 1) * page_size,
        take: page_size
      }),
      this.prisma.blog.count({ where })
    ]);

    return new PaginatedData(blogs, total, page, page_size);
  }

  /**
   * 删除博客文章
   */
  async delete(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id }
    });

    if (!blog) {
      throw new NotFoundException('博客文章不存在');
    }

    return this.prisma.blog.delete({
      where: { id }
    });
  }

  /**
   * 增加浏览量
   */
  async incrementViewCount(id: number) {
    return this.prisma.blog.update({
      where: { id },
      data: {
        view_count: {
          increment: 1
        }
      }
    });
  }

  // ================================
  // 博客标签相关方法
  // ================================

  /**
   * 创建标签
   */
  async createTag(data: BlogTagCreateDto) {
    const slug = data.slug || await this.formatSlug(data.name);
    
    // 检查标签名称和 slug 唯一性
    const existing = await this.prisma.blogTag.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: slug }
        ]
      }
    });

    if (existing) {
      throw new BadRequestException('标签名称或 slug 已存在');
    }

    return this.prisma.blogTag.create({
      data: {
        ...data,
        slug
      }
    });
  }

  /**
   * 更新标签
   */
  async updateTag(data: BlogTagUpdateDto) {
    const { id, ...updateData } = data;

    const existing = await this.prisma.blogTag.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException('标签不存在');
    }

    // 如果更新了名称或 slug，检查唯一性
    if (updateData.name || updateData.slug) {
      const slug = updateData.slug || await this.formatSlug(updateData.name || existing.name);
      
      const duplicate = await this.prisma.blogTag.findFirst({
        where: {
          OR: [
            { name: updateData.name || existing.name },
            { slug: slug }
          ],
          id: { not: id }
        }
      });

      if (duplicate) {
        throw new BadRequestException('标签名称或 slug 已存在');
      }

      updateData.slug = slug;
    }

    return this.prisma.blogTag.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * 获取标签列表
   */
  async findTags(query: BlogTagListDto): Promise<PaginatedData<any>> {
    const { page, page_size, project_type, is_active, search } = query;

    const where: any = {};
    if (project_type) where.project_type = project_type;
    if (is_active !== undefined) where.is_active = is_active;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [tags, total] = await Promise.all([
      this.prisma.blogTag.findMany({
        where,
        orderBy: { sort_order: 'asc' },
        skip: (page - 1) * page_size,
        take: page_size
      }),
      this.prisma.blogTag.count({ where })
    ]);

    return new PaginatedData(tags, total, page, page_size);
  }

  /**
   * 删除标签
   */
  async deleteTag(id: number) {
    const tag = await this.prisma.blogTag.findUnique({
      where: { id }
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return this.prisma.blogTag.delete({
      where: { id }
    });
  }

  // ================================
  // 博客分类相关方法
  // ================================

  /**
   * 创建分类
   */
  async createCategory(data: BlogCategoryCreateDto) {
    const slug = data.slug || await this.formatSlug(data.name);
    
    // 检查分类名称和 slug 唯一性
    const existing = await this.prisma.blogCategory.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: slug }
        ]
      }
    });

    if (existing) {
      throw new BadRequestException('分类名称或 slug 已存在');
    }

    return this.prisma.blogCategory.create({
      data: {
        ...data,
        slug
      }
    });
  }

  /**
   * 更新分类
   */
  async updateCategory(data: BlogCategoryUpdateDto) {
    const { id, ...updateData } = data;

    const existing = await this.prisma.blogCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException('分类不存在');
    }

    // 如果更新了名称或 slug，检查唯一性
    if (updateData.name || updateData.slug) {
      const slug = updateData.slug || await this.formatSlug(updateData.name || existing.name);
      
      const duplicate = await this.prisma.blogCategory.findFirst({
        where: {
          OR: [
            { name: updateData.name || existing.name },
            { slug: slug }
          ],
          id: { not: id }
        }
      });

      if (duplicate) {
        throw new BadRequestException('分类名称或 slug 已存在');
      }

      updateData.slug = slug;
    }

    return this.prisma.blogCategory.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * 获取分类列表
   */
  async findCategories(query: BlogCategoryListDto): Promise<PaginatedData<any>> {
    const { page, page_size, project_type, is_active, parent_id, search } = query;

    const where: any = {};
    if (project_type) where.project_type = project_type;
    if (is_active !== undefined) where.is_active = is_active;
    if (parent_id !== undefined) where.parent_id = parent_id;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [categories, total] = await Promise.all([
      this.prisma.blogCategory.findMany({
        where,
        include: {
          parent: true,
          children: true
        },
        orderBy: { sort_order: 'asc' },
        skip: (page - 1) * page_size,
        take: page_size
      }),
      this.prisma.blogCategory.count({ where })
    ]);

    return new PaginatedData(categories, total, page, page_size);
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return this.prisma.blogCategory.delete({
      where: { id }
    });
  }
}
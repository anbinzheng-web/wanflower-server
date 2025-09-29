import { Injectable } from "@nestjs/common";
import { PrismaService } from "shared/services/prisma.service";
import { BlogCreateDto } from "./blog.dto";
import slugify from 'slugify';
import pinyin from 'pinyin';
import { BlogStatus } from '@prisma/client';
import readingTime from "reading-time";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}
  
  async formatSlug(title: string) {
    const py = pinyin(title, { style: pinyin.STYLE_NORMAL }).flat().join('-');
    return slugify(py, { lower: true, strict: true });
  }

  async create(data: BlogCreateDto) {
    const slug = data.slug || await this.formatSlug(data.title);
    return this.prisma.blog.create({
      data: {
        title: data.title,
        author: data.author || 'Anbin',
        slug: slug,
        cover_image: data.cover_image || '',
        seo: data.seo,
        md: data.md || '',
        language: 'en',
        status: BlogStatus.DRAFT,
        reading_time: readingTime(data.md||'').minutes
      }
    });
  }
}
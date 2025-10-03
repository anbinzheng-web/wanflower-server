import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { PrismaService } from 'shared/services/prisma.service';

describe('BlogService', () => {
  let service: BlogService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: PrismaService,
          useValue: {
            blog: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            blogTag: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            blogCategory: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should format slug correctly', async () => {
    const title = '测试博客标题';
    const slug = await service.formatSlug(title);
    expect(slug).toBeDefined();
    expect(typeof slug).toBe('string');
  });

  it('should create blog with correct data structure', async () => {
    const mockBlog = {
      id: 1,
      title: '测试博客',
      slug: 'test-blog',
      author: 'Test Author',
      language: 'zh',
      md: '# 测试内容',
      summary: '测试摘要',
      cover_image: 'https://example.com/image.jpg',
      reading_time: 5,
      seo: { title: 'SEO标题', description: 'SEO描述' },
      status: 'DRAFT',
      view_count: 0,
      project_type: 'test-project',
      is_featured: false,
      sort_order: 0,
      created_at: new Date(),
      updated_at: new Date(),
      tags: [],
      categories: [],
    };

    (prismaService.blog.create as jest.Mock).mockResolvedValue(mockBlog);
    (prismaService.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);

    const blogData = {
      title: '测试博客',
      project_type: 'test-project',
      md: '# 测试内容',
      summary: '测试摘要',
    };

    const result = await service.create(blogData);
    expect(result).toBeDefined();
    expect(prismaService.blog.create).toHaveBeenCalled();
  });
});

# 统一上传系统架构

## 概述

经过重构，媒体管理系统现在完全整合了现有的上传服务架构，支持本地存储、OSS 存储和 CDN 存储，同时实现了按业务类型分类存储的功能。

## 架构设计

### 1. 分层架构

```
┌─────────────────────────────────────┐
│           业务层 (Business)          │
├─────────────────────────────────────┤
│  BlogMediaService                   │
│  ProductMediaService                │
│  ReviewMediaService                 │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│        媒体管理层 (Media)            │
├─────────────────────────────────────┤
│  MediaManagementService             │
│  - 统一媒体管理                      │
│  - 业务类型分类                      │
│  - 元数据提取                        │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│        上传服务层 (Upload)           │
├─────────────────────────────────────┤
│  UploadService                      │
│  - 统一上传接口                      │
│  - 存储类型适配                      │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│        存储实现层 (Storage)          │
├─────────────────────────────────────┤
│  LocalStorageService                │
│  OssStorageService                  │
│  CdnStorageService (预留)           │
└─────────────────────────────────────┘
```

### 2. 存储类型支持

#### 本地存储 (LOCAL)
- **路径结构**: `uploads/{businessType}/{filename}`
- **特点**: 按业务类型自动分类存储
- **适用场景**: 开发环境、小规模部署

#### OSS 存储 (OSS)
- **URL 格式**: `https://bucket.oss-region.aliyuncs.com/path/filename`
- **特点**: 高可用、高并发、全球加速
- **适用场景**: 生产环境、大规模部署

#### CDN 存储 (CDN)
- **URL 格式**: `https://cdn.domain.com/path/filename`
- **特点**: 全球加速、边缘缓存
- **适用场景**: 全球用户访问

## 核心组件

### 1. MediaManagementService

统一的媒体管理服务，负责：
- 文件验证和元数据提取
- 业务类型分类存储
- 数据库记录管理
- 多存储类型支持

```typescript
// 上传媒体文件
async uploadMedia(options: MediaUploadOptions) {
  // 1. 验证文件
  this.validateMediaFile(file, type);
  
  // 2. 使用现有上传服务上传
  const uploadResult = await this.uploadService.upload(file, businessType);
  
  // 3. 解析存储信息
  const storageInfo = this.parseStorageInfo(uploadResult, businessType);
  
  // 4. 保存到数据库
  const mediaRecord = await this.prisma.media.create({...});
  
  return mediaRecord;
}
```

### 2. UploadService

统一的上传服务，负责：
- 存储类型适配
- 业务类型参数传递
- 统一的删除接口

```typescript
upload(file: Express.Multer.File, businessType?: string) {
  // 支持业务类型参数传递
  if (this.storageService.upload.length > 1) {
    return this.storageService.upload(file, businessType);
  }
  return this.storageService.upload(file);
}
```

### 3. LocalStorageService

本地存储服务，支持：
- 按业务类型分类存储
- 自动目录创建
- 文件哈希命名

```typescript
async upload(file: Express.Multer.File, businessType?: string) {
  // 1. 生成文件哈希名
  const fileHash = global.$md5(file.buffer.toString());
  const filename = `${fileHash}${path.extname(file.originalname)}`;
  
  // 2. 创建业务类型目录
  const businessPath = this.getBusinessTypePath(businessType);
  const uploadDir = path.join(process.cwd(), 'uploads', businessPath);
  
  // 3. 保存文件
  await fs.writeFile(path.join(uploadDir, filename), file.buffer);
  
  return `/uploads/${businessPath}/${filename}`;
}
```

## 存储类型检测

系统会自动检测上传结果的存储类型：

```typescript
private parseStorageInfo(uploadResult: string, businessType: string) {
  // OSS 检测
  if (uploadResult.includes('oss-') || uploadResult.includes('aliyuncs.com')) {
    return { storageType: StorageType.OSS, ... };
  }
  
  // CDN 检测
  if (uploadResult.includes('cdn.') || uploadResult.includes('cloudfront.')) {
    return { storageType: StorageType.CDN, ... };
  }
  
  // 默认本地存储
  return { storageType: StorageType.LOCAL, ... };
}
```

## 文件分类存储

### 目录结构

```
uploads/
├── products/          # 产品相关媒体
│   ├── product1.jpg
│   ├── product2.mp4
│   └── ...
├── blogs/             # 博客相关媒体
│   ├── blog-cover.jpg
│   ├── blog-content.png
│   └── ...
├── reviews/           # 评论相关媒体
│   ├── review1.jpg
│   └── ...
├── users/             # 用户相关媒体
│   ├── avatar1.jpg
│   └── ...
├── general/           # 通用媒体
│   └── ...
└── thumbnails/        # 所有缩略图
    ├── product1_thumb.jpg
    ├── blog-cover_thumb.jpg
    └── ...
```

### 业务类型映射

```typescript
const businessTypeMapping = {
  'PRODUCT': 'products',
  'BLOG': 'blogs',
  'REVIEW': 'reviews',
  'USER': 'users',
  'GENERAL': 'general'
};
```

## 配置管理

### 环境变量

```bash
# 存储驱动选择
STORAGE_DRIVER=local  # local | oss | cdn

# 本地存储配置
IMAGE_LOCAL_UPLOAD_PATH=uploads

# OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=your_access_key
OSS_SECRET_KEY=your_secret_key
OSS_BUCKET=your_bucket_name

# CDN 配置
CDN_DOMAIN=your-cdn-domain.com
```

### 存储服务注入

```typescript
{
  provide: 'STORAGE_SERVICE',
  useClass: process.env.STORAGE_DRIVER === 'oss'
    ? OssStorageService
    : LocalStorageService,
}
```

## API 接口

### 统一媒体管理接口

```http
POST /media/upload
Content-Type: multipart/form-data

{
  "file": File,
  "business_type": "BLOG",
  "business_id": 123,
  "type": "IMAGE",
  "category": "COVER"
}
```

### 博客媒体管理接口

```http
POST /blog/media/upload
Content-Type: multipart/form-data

{
  "file": File,
  "blog_id": 123,
  "type": "IMAGE",
  "category": "COVER"
}
```

## 使用示例

### 1. 在博客中上传封面图片

```typescript
// 前端
const formData = new FormData();
formData.append('file', file);
formData.append('blog_id', '123');
formData.append('type', 'IMAGE');
formData.append('category', 'COVER');

const response = await fetch('/api/blog/media/upload', {
  method: 'POST',
  body: formData
});
```

### 2. 在服务中使用

```typescript
// 后端服务
@Injectable()
export class BlogService {
  constructor(
    private mediaService: MediaManagementService
  ) {}

  async createBlogWithMedia(data: BlogCreateDto, coverFile: any) {
    // 创建博客
    const blog = await this.prisma.blog.create({ data });
    
    // 上传封面图片
    if (coverFile) {
      const media = await this.mediaService.uploadMedia({
        file: coverFile,
        businessType: 'BLOG',
        businessId: blog.id,
        type: 'IMAGE',
        category: 'COVER'
      });
      
      // 更新博客封面
      await this.prisma.blog.update({
        where: { id: blog.id },
        data: { cover_image: media.url }
      });
    }
    
    return blog;
  }
}
```

## 优势特性

### 1. 完全兼容现有架构
- 使用现有的 `UploadService` 和存储服务
- 保持原有的 OSS 和 CDN 支持
- 无需修改现有业务代码

### 2. 自动分类存储
- 按业务类型自动创建目录
- 避免文件混乱
- 便于管理和维护

### 3. 多存储类型支持
- 本地存储：开发环境
- OSS 存储：生产环境
- CDN 存储：全球加速

### 4. 统一管理接口
- 统一的媒体管理 API
- 完整的元数据记录
- 灵活的权限控制

### 5. 扩展性强
- 易于添加新的存储类型
- 支持自定义业务类型
- 可配置的存储策略

## 迁移指南

### 从旧系统迁移

1. **数据库迁移**：运行 Prisma 迁移添加 Media 表
2. **代码更新**：使用新的 MediaManagementService
3. **文件迁移**：将现有文件按业务类型重新分类
4. **配置更新**：设置存储驱动和环境变量

### 渐进式迁移

1. **第一阶段**：新功能使用统一媒体管理
2. **第二阶段**：逐步迁移现有功能
3. **第三阶段**：完全切换到新系统

## 监控和维护

### 1. 存储监控
- 文件上传成功率
- 存储空间使用情况
- 文件访问频率

### 2. 性能监控
- 上传速度统计
- 存储类型分布
- 错误率统计

### 3. 维护任务
- 定期清理过期文件
- 存储空间优化
- 备份和恢复

---

**总结**：统一上传系统完美整合了现有的上传服务架构，在保持兼容性的同时，添加了按业务类型分类存储的功能，支持多种存储类型，提供了完整的媒体管理解决方案。

# 媒体管理系统

## 概述

媒体管理系统是一个统一的文件上传和管理解决方案，支持按业务类型分类存储，提供完整的媒体文件生命周期管理。

## 核心特性

### 1. 统一管理
- **集中式服务**：所有媒体文件通过统一的 `MediaManagementService` 管理
- **业务类型分类**：支持 PRODUCT、BLOG、REVIEW、USER、GENERAL 等业务类型
- **分类存储**：按业务类型自动创建目录结构，避免文件混乱

### 2. 文件分类存储
```
uploads/
├── products/     # 产品相关媒体
├── blogs/        # 博客相关媒体
├── reviews/      # 评论相关媒体
├── users/        # 用户相关媒体
├── general/      # 通用媒体
└── thumbnails/   # 缩略图
```

### 3. 媒体类型支持
- **图片**：JPEG、PNG、GIF、WebP
- **视频**：MP4、WebM、OGG
- **自动缩略图生成**：图片自动生成 300x300 缩略图
- **元数据提取**：自动提取图片尺寸、视频时长等信息

### 4. 权限控制
- **用户权限**：普通用户只能管理自己的媒体文件
- **管理员权限**：员工和管理员可以管理所有媒体文件
- **业务关联**：媒体文件与具体业务实体关联

## 数据库设计

### Media 表结构
```sql
CREATE TABLE "Media" (
  "id" SERIAL PRIMARY KEY,
  "business_type" VARCHAR(50) NOT NULL,  -- 业务类型
  "business_id" INTEGER,                 -- 关联的业务ID
  "type" "MediaType" NOT NULL,          -- 媒体类型 (IMAGE/VIDEO)
  "storage_type" "StorageType" DEFAULT 'LOCAL', -- 存储类型
  "local_path" VARCHAR(500),            -- 本地文件路径
  "filename" VARCHAR(255),              -- 原始文件名
  "file_size" BIGINT,                   -- 文件大小
  "mime_type" VARCHAR(100),             -- MIME类型
  "width" INTEGER,                      -- 宽度
  "height" INTEGER,                     -- 高度
  "duration" INTEGER,                   -- 时长（秒）
  "thumbnail_local" VARCHAR(500),       -- 缩略图路径
  "alt_text" VARCHAR(255),              -- 替代文本
  "sort_order" INTEGER DEFAULT 0,       -- 排序权重
  "category" VARCHAR(50) DEFAULT 'DEFAULT', -- 媒体分类
  "user_id" INTEGER,                    -- 上传用户ID
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "deleted_at" TIMESTAMP
);
```

## API 接口

### 统一媒体管理接口

#### 1. 上传单个媒体文件
```http
POST /media/upload
Content-Type: multipart/form-data

{
  "file": File,
  "business_type": "BLOG",
  "business_id": 123,
  "type": "IMAGE",
  "alt_text": "描述文本",
  "sort_order": 0,
  "category": "COVER"
}
```

#### 2. 批量上传媒体文件
```http
POST /media/batch-upload
Content-Type: multipart/form-data

{
  "files": File[],
  "business_type": "BLOG",
  "business_id": 123,
  "type": "IMAGE",
  "category": "GALLERY"
}
```

#### 3. 获取媒体列表
```http
GET /media/list?business_type=BLOG&business_id=123&page=1&page_size=20
```

#### 4. 更新媒体信息
```http
PUT /media/update
{
  "id": 123,
  "alt_text": "新的描述",
  "sort_order": 1,
  "category": "DETAIL"
}
```

#### 5. 删除媒体文件
```http
DELETE /media/delete
{
  "id": 123
}
```

### 博客媒体管理接口

#### 1. 上传博客媒体
```http
POST /blog/media/upload
Content-Type: multipart/form-data

{
  "file": File,
  "blog_id": 123,
  "type": "IMAGE",
  "alt_text": "博客图片",
  "category": "COVER"
}
```

#### 2. 批量上传博客媒体
```http
POST /blog/media/batch-upload/123
Content-Type: multipart/form-data

{
  "files": File[],
  "type": "IMAGE"
}
```

#### 3. 获取博客媒体列表
```http
GET /blog/media/list/123?type=IMAGE&category=COVER
```

#### 4. 设置博客封面
```http
POST /blog/media/set-cover
{
  "blog_id": 123,
  "media_id": 456
}
```

## 使用示例

### 1. 在博客中上传封面图片

```typescript
// 前端代码示例
const uploadCoverImage = async (blogId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('blog_id', blogId.toString());
  formData.append('type', 'IMAGE');
  formData.append('category', 'COVER');
  formData.append('alt_text', '博客封面图片');

  const response = await fetch('/api/blog/media/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};
```

### 2. 在服务中使用媒体管理

```typescript
// 后端服务代码示例
@Injectable()
export class BlogService {
  constructor(
    private mediaService: MediaManagementService
  ) {}

  async createBlogWithCover(data: BlogCreateDto, coverFile: any) {
    // 创建博客
    const blog = await this.prisma.blog.create({
      data: { ...data }
    });

    // 上传封面图片
    if (coverFile) {
      const media = await this.mediaService.uploadMedia({
        file: coverFile,
        businessType: 'BLOG',
        businessId: blog.id,
        type: 'IMAGE',
        category: 'COVER'
      });

      // 更新博客封面字段
      await this.prisma.blog.update({
        where: { id: blog.id },
        data: { cover_image: media.url }
      });
    }

    return blog;
  }
}
```

## 媒体分类说明

### 预定义分类
- **DEFAULT**：默认分类
- **COVER**：封面图
- **GALLERY**：相册
- **DETAIL**：详情图
- **THUMBNAIL**：缩略图
- **AVATAR**：头像
- **BANNER**：横幅
- **ICON**：图标

### 业务类型
- **PRODUCT**：产品相关媒体
- **BLOG**：博客相关媒体
- **REVIEW**：评论相关媒体
- **USER**：用户相关媒体
- **GENERAL**：通用媒体

## 文件大小限制

- **图片文件**：最大 10MB
- **视频文件**：最大 100MB
- **视频时长**：最长 60 秒（评论视频）

## 安全特性

### 1. 文件类型验证
- 严格的文件类型检查
- 防止恶意文件上传
- 支持的文件格式白名单

### 2. 权限控制
- 基于角色的访问控制
- 用户只能管理自己的媒体文件
- 管理员可以管理所有媒体文件

### 3. 文件安全
- 文件内容验证
- 病毒扫描（可扩展）
- 安全的文件存储路径

## 扩展性设计

### 1. 存储后端支持
- 本地存储（当前实现）
- OSS 存储（预留接口）
- CDN 存储（预留接口）

### 2. 图片处理
- 自动缩略图生成
- 图片压缩优化
- 多尺寸图片生成（可扩展）

### 3. 视频处理
- 视频转码（可扩展）
- 视频预览图生成（可扩展）
- 视频压缩优化（可扩展）

## 监控和日志

### 1. 操作日志
- 文件上传记录
- 文件删除记录
- 权限变更记录

### 2. 性能监控
- 上传速度统计
- 存储空间使用情况
- 文件访问频率统计

### 3. 错误处理
- 详细的错误信息
- 异常情况记录
- 自动重试机制

## 最佳实践

### 1. 文件命名
- 使用哈希值避免文件名冲突
- 保留原始文件扩展名
- 统一的文件命名规范

### 2. 目录结构
- 按业务类型分类存储
- 按日期分目录（可扩展）
- 定期清理临时文件

### 3. 性能优化
- 异步文件处理
- 批量操作支持
- 缓存机制（可扩展）

## 故障排查

### 1. 常见问题
- 文件上传失败：检查文件大小和类型
- 权限错误：确认用户角色和文件所有权
- 存储空间不足：清理过期文件

### 2. 日志查看
- 查看应用日志了解详细错误信息
- 检查文件系统权限
- 监控磁盘空间使用情况

### 3. 性能问题
- 检查网络连接速度
- 优化文件大小
- 考虑使用 CDN 加速

---

**注意**：详细的 API 接口文档请参考 Swagger 文档，数据库表结构请参考 Prisma Schema 文件。


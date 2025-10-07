# 媒体管理系统使用指南

## 🎯 系统概述

万花电商系统现在拥有一个完整的统一媒体管理系统，支持产品、博客、评论等所有业务场景的媒体文件管理。

## 🚀 快速开始

### 1. 启动服务

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

### 2. 配置存储

编辑 `.env` 文件：

```bash
# 选择存储类型
STORAGE_DRIVER=local  # local | oss | cdn

# 本地存储配置
IMAGE_LOCAL_UPLOAD_PATH=uploads

# OSS 配置（可选）
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET=your-bucket-name

# CDN 配置（可选）
CDN_DOMAIN=your-cdn-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

### 3. 测试系统

```bash
# 运行测试脚本
node test-media-system.js
```

## 📚 API 使用指南

### 产品媒体管理

#### 上传产品媒体
```bash
curl -X POST http://localhost:3000/api/product/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "product_id=1" \
  -F "type=IMAGE" \
  -F "media_category=MAIN"
```

#### 批量上传
```bash
curl -X POST http://localhost:3000/api/product/media/batch-upload/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "type=IMAGE"
```

#### 获取媒体列表
```bash
curl -X GET http://localhost:3000/api/product/media/list/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 设置主图
```bash
curl -X POST http://localhost:3000/api/product/media/set-main/1/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 评论媒体管理

#### 上传评论媒体
```bash
curl -X POST http://localhost:3000/api/review/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "review_id=1" \
  -F "type=IMAGE"
```

#### 批量上传
```bash
curl -X POST http://localhost:3000/api/review/media/batch-upload/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

### 博客媒体管理

#### 上传博客媒体
```bash
curl -X POST http://localhost:3000/api/blog/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "blog_id=1" \
  -F "type=IMAGE" \
  -F "category=COVER"
```

#### 设置封面
```bash
curl -X POST http://localhost:3000/api/blog/media/set-cover \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blog_id": 1, "media_id": 123}'
```

### 统一媒体管理

#### 上传媒体
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "business_type=PRODUCT" \
  -F "business_id=1" \
  -F "type=IMAGE" \
  -F "category=MAIN"
```

#### 获取媒体列表
```bash
curl -X GET "http://localhost:3000/api/media/list?business_type=PRODUCT&business_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 存储配置

### 本地存储

本地存储是最简单的存储方式，适合开发环境：

```bash
STORAGE_DRIVER=local
IMAGE_LOCAL_UPLOAD_PATH=uploads
```

文件将存储在：
```
uploads/
├── products/2024/01/15/filename.jpg
├── blogs/2024/01/15/filename.jpg
├── reviews/2024/01/15/filename.jpg
└── thumbnails/
```

### OSS 存储

阿里云对象存储，适合生产环境：

```bash
STORAGE_DRIVER=oss
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET=your-bucket-name
```

### CDN 存储

AWS CloudFront + S3，适合全球用户：

```bash
STORAGE_DRIVER=cdn
CDN_DOMAIN=your-cdn-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

## 📊 监控和健康检查

### 检查存储状态
```bash
curl -X GET http://localhost:3000/api/storage-health/status
```

### 查看存储配置
```bash
curl -X GET http://localhost:3000/api/storage-health/config
```

### 测试存储连接
```bash
curl -X GET http://localhost:3000/api/storage-health/test
```

## 🔄 数据迁移

如果你有现有的媒体数据需要迁移：

```bash
# 运行数据迁移脚本
node scripts/migrate-media-data.js
```

## 🛠️ 开发指南

### 添加新的业务类型

1. 在 `BusinessType` 枚举中添加新类型
2. 在 `MediaManagementService` 中添加处理逻辑
3. 创建对应的业务媒体服务
4. 更新存储路径配置

### 添加新的存储后端

1. 实现 `IStorageService` 接口
2. 在 `SharedModule` 中注册服务
3. 更新 `StorageType` 枚举
4. 添加环境变量配置

### 自定义媒体处理

1. 在 `MediaManagementService` 中添加处理逻辑
2. 更新元数据提取逻辑
3. 添加缩略图生成逻辑

## 📝 最佳实践

### 1. 文件命名
- 使用有意义的文件名
- 避免特殊字符
- 保持文件名简洁

### 2. 文件大小
- 图片：建议不超过 5MB
- 视频：建议不超过 50MB
- 评论视频：不超过 60秒

### 3. 文件类型
- 图片：JPEG, PNG, WebP, GIF
- 视频：MP4, WebM, QuickTime

### 4. 存储策略
- 开发环境：使用本地存储
- 测试环境：使用 OSS 存储
- 生产环境：使用 CDN 存储

### 5. 安全考虑
- 验证文件类型
- 限制文件大小
- 检查文件内容
- 使用 HTTPS

## 🐛 故障排查

### 常见问题

1. **上传失败**
   - 检查文件大小限制
   - 验证文件类型
   - 确认存储配置

2. **存储连接失败**
   - 检查环境变量
   - 验证存储凭证
   - 确认网络连接

3. **权限错误**
   - 检查 JWT token
   - 验证用户权限
   - 确认业务关联

### 调试模式

启用详细日志：

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

### 日志位置

- 应用日志：控制台输出
- 错误日志：检查错误堆栈
- 存储日志：查看存储服务日志

## 📞 技术支持

如果遇到问题，请：

1. 查看日志文件
2. 检查配置设置
3. 运行健康检查
4. 联系技术支持

## 📚 相关文档

- [API 接口文档](http://localhost:3000/api/docs)
- [存储配置说明](./configuration/storage-configuration.md)
- [迁移指南](./migration/complete-migration-summary.md)
- [开发文档](./development/dependencies-setup.md)

---

**祝您使用愉快！** 🎉

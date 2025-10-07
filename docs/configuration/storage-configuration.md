# 存储配置说明

## 概述

系统支持三种存储方式：本地存储、OSS 存储和 CDN 存储。通过环境变量 `STORAGE_DRIVER` 来控制使用哪种存储方式。

## 环境变量配置

### 基础配置

```bash
# 存储驱动选择
STORAGE_DRIVER="local"  # local | oss | cdn

# 本地存储路径
IMAGE_LOCAL_UPLOAD_PATH="uploads"
```

### 本地存储 (LOCAL)

本地存储是最简单的存储方式，适合开发环境和小规模部署。

**配置项：**
```bash
STORAGE_DRIVER="local"
IMAGE_LOCAL_UPLOAD_PATH="uploads"
```

**特点：**
- 文件存储在服务器本地磁盘
- 按业务类型自动分类存储
- 无需额外配置
- 适合开发环境

**目录结构：**
```
uploads/
├── products/
├── blogs/
├── reviews/
├── users/
├── general/
└── thumbnails/
```

### OSS 存储 (OSS)

阿里云对象存储，适合生产环境和大规模部署。

**配置项：**
```bash
STORAGE_DRIVER="oss"
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY="your-oss-access-key"
OSS_SECRET_KEY="your-oss-secret-key"
OSS_BUCKET="your-oss-bucket-name"
```

**环境变量说明：**
- `OSS_REGION`: OSS 区域，如 `oss-cn-hangzhou`、`oss-cn-beijing` 等
- `OSS_ACCESS_KEY`: OSS 访问密钥 ID
- `OSS_SECRET_KEY`: OSS 访问密钥 Secret
- `OSS_BUCKET`: OSS 存储桶名称

**特点：**
- 高可用、高并发
- 全球加速
- 自动备份
- 按业务类型和日期分类存储

**文件路径结构：**
```
products/2024/01/15/filename.jpg
blogs/2024/01/15/filename.jpg
reviews/2024/01/15/filename.jpg
```

**URL 格式：**
```
https://your-bucket.oss-cn-hangzhou.aliyuncs.com/products/2024/01/15/filename.jpg
```

### CDN 存储 (CDN)

AWS CloudFront + S3，适合全球用户访问。

**配置项：**
```bash
STORAGE_DRIVER="cdn"
CDN_DOMAIN="your-cdn-domain.com"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
CLOUDFRONT_DISTRIBUTION_ID="your-cloudfront-distribution-id"
```

**环境变量说明：**
- `CDN_DOMAIN`: CDN 域名
- `AWS_ACCESS_KEY_ID`: AWS 访问密钥 ID
- `AWS_SECRET_ACCESS_KEY`: AWS 访问密钥 Secret
- `AWS_REGION`: AWS 区域
- `AWS_S3_BUCKET`: S3 存储桶名称
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront 分发 ID

**特点：**
- 全球 CDN 加速
- 边缘缓存
- 自动缓存失效
- 高可用性

**URL 格式：**
```
https://your-cdn-domain.com/products/2024/01/15/filename.jpg
```

## 存储服务选择

### 开发环境
```bash
STORAGE_DRIVER="local"
IMAGE_LOCAL_UPLOAD_PATH="uploads"
```

### 测试环境
```bash
STORAGE_DRIVER="oss"
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY="test-access-key"
OSS_SECRET_KEY="test-secret-key"
OSS_BUCKET="test-bucket"
```

### 生产环境
```bash
STORAGE_DRIVER="cdn"
CDN_DOMAIN="cdn.yourdomain.com"
AWS_ACCESS_KEY_ID="prod-access-key"
AWS_SECRET_ACCESS_KEY="prod-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="prod-bucket"
CLOUDFRONT_DISTRIBUTION_ID="prod-distribution-id"
```

## 存储服务实现

### 本地存储服务 (LocalStorageService)

```typescript
// 特点
- 按业务类型分类存储
- 自动创建目录
- 文件哈希命名
- 支持缩略图生成
```

### OSS 存储服务 (OssStorageService)

```typescript
// 特点
- 按业务类型和日期分类
- 自动重试机制
- 缓存控制
- 模拟模式支持
```

### CDN 存储服务 (CdnStorageService)

```typescript
// 特点
- S3 + CloudFront 集成
- 自动缓存失效
- 全球加速
- 模拟模式支持
```

## 模拟模式

当存储服务配置不完整时，系统会自动进入模拟模式：

- **OSS 模拟模式**：返回模拟的 OSS URL
- **CDN 模拟模式**：返回模拟的 CDN URL
- **日志记录**：记录配置缺失的警告信息

## 文件分类规则

### 业务类型分类
- `PRODUCT` → `products/`
- `BLOG` → `blogs/`
- `REVIEW` → `reviews/`
- `USER` → `users/`
- `GENERAL` → `general/`

### 日期分类 (OSS/CDN)
- 格式：`YYYY/MM/DD`
- 示例：`2024/01/15/`

### 文件命名
- 使用 MD5 哈希值避免冲突
- 保留原始文件扩展名
- 格式：`{hash}.{ext}`

## 监控和日志

### 日志级别
- `INFO`: 正常操作日志
- `WARN`: 配置缺失警告
- `ERROR`: 上传/删除失败错误

### 监控指标
- 上传成功率
- 存储空间使用情况
- 文件访问频率
- 错误率统计

## 故障排查

### 常见问题

1. **OSS 上传失败**
   - 检查 OSS 配置是否正确
   - 验证访问密钥权限
   - 确认存储桶存在

2. **CDN 上传失败**
   - 检查 AWS 配置
   - 验证 S3 存储桶权限
   - 确认 CloudFront 分发配置

3. **本地存储失败**
   - 检查磁盘空间
   - 验证目录权限
   - 确认路径配置正确

### 调试方法

1. **启用详细日志**
   ```bash
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

2. **检查存储服务状态**
   ```typescript
   // 检查 OSS 连接
   await ossService.checkConnection();
   
   // 检查 CDN 连接
   await cdnService.checkConnection();
   ```

3. **测试文件上传**
   ```bash
   curl -X POST \
     -F "file=@test.jpg" \
     -F "business_type=BLOG" \
     -F "type=IMAGE" \
     http://localhost:3000/api/media/upload
   ```

## 最佳实践

### 1. 环境配置
- 开发环境使用本地存储
- 测试环境使用 OSS 存储
- 生产环境使用 CDN 存储

### 2. 安全配置
- 使用 IAM 角色而非硬编码密钥
- 定期轮换访问密钥
- 限制存储桶访问权限

### 3. 性能优化
- 启用 CDN 缓存
- 使用适当的缓存策略
- 定期清理过期文件

### 4. 监控告警
- 设置存储空间告警
- 监控上传失败率
- 配置错误日志告警

---

**注意**：详细的 API 接口文档请参考 Swagger 文档，数据库表结构请参考 Prisma Schema 文件。

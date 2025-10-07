# 依赖包安装说明

## 概述

为了支持 OSS 和 CDN 存储功能，需要安装相应的依赖包。当前代码已经预留了接口，但相关依赖包被注释掉了，需要根据实际需求安装。

## 本地存储

本地存储不需要额外依赖，使用 Node.js 内置的 `fs` 模块。

## OSS 存储 (阿里云对象存储)

### 安装依赖

```bash
pnpm add ali-oss
pnpm add @types/ali-oss -D
```

### 启用 OSS 功能

1. 取消注释 `src/shared/services/upload/oss-storage.service.ts` 中的相关代码：

```typescript
// 取消注释这些行
import OSS from 'ali-oss';

// 在 initializeOssClient 方法中
this.client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY,
  accessKeySecret: process.env.OSS_SECRET_KEY,
  bucket: process.env.OSS_BUCKET,
  secure: true,
  timeout: 60000,
});

// 在 upload 方法中
const result = await this.client.put(filePath, file.buffer, {
  headers: {
    'Content-Type': file.mimetype,
    'Cache-Control': 'max-age=31536000',
  }
});
return result.url;

// 在 delete 方法中
await this.client.delete(fileKey);

// 在 checkConnection 方法中
await this.client.getBucketInfo();
```

2. 配置环境变量：

```bash
STORAGE_DRIVER=oss
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET=your-bucket-name
```

## CDN 存储 (AWS CloudFront + S3)

### 安装依赖

```bash
# AWS SDK v3 (推荐)
pnpm add @aws-sdk/client-s3 @aws-sdk/client-cloudfront

# 或者 AWS SDK v2 (传统版本)
pnpm add aws-sdk
pnpm add @types/aws-sdk -D
```

### 启用 CDN 功能

1. 取消注释 `src/shared/services/upload/cdn-storage.service.ts` 中的相关代码：

```typescript
// 取消注释这些行
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';

// 在 initializeCdnClient 方法中
this.s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

this.cloudFrontClient = new AWS.CloudFront({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 在 upload 方法中
const uploadCommand = new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET!,
  Key: filePath,
  Body: file.buffer,
  ContentType: file.mimetype,
  CacheControl: 'max-age=31536000',
  Metadata: {
    'business-type': businessType || 'general',
    'original-name': file.originalname,
  }
});

await this.s3Client.send(uploadCommand);
const cdnUrl = this.generateCdnUrl(filePath);
return cdnUrl;

// 在 delete 方法中
const deleteCommand = new DeleteObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET!,
  Key: fileKey,
});

await this.s3Client.send(deleteCommand);
await this.invalidateCloudFrontCache(fileKey);

// 在 invalidateCloudFrontCache 方法中
const invalidationParams = {
  DistributionId: distributionId,
  InvalidationBatch: {
    CallerReference: `invalidation-${Date.now()}`,
    Paths: {
      Quantity: 1,
      Items: [`/${filePath}`]
    }
  }
};

await this.cloudFrontClient.createInvalidation(invalidationParams).promise();

// 在 checkConnection 方法中
const command = new HeadBucketCommand({
  Bucket: process.env.AWS_S3_BUCKET!
});
await this.s3Client.send(command);

// 在 getFileInfo 方法中
const command = new HeadObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET!,
  Key: filePath,
});

const response = await this.s3Client.send(command);
return {
  size: response.ContentLength,
  lastModified: response.LastModified,
  contentType: response.ContentType,
  etag: response.ETag,
};
```

2. 配置环境变量：

```bash
STORAGE_DRIVER=cdn
CDN_DOMAIN=your-cdn-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-distribution-id
```

## 其他可选依赖

### 图片处理 (已安装)

```bash
pnpm add sharp
```

### 文件类型检测

```bash
pnpm add file-type
pnpm add @types/file-type -D
```

### 视频处理 (可选)

```bash
pnpm add fluent-ffmpeg
pnpm add @types/fluent-ffmpeg -D
```

## 安装脚本

创建一个安装脚本来简化依赖安装：

```bash
#!/bin/bash
# install-storage-deps.sh

echo "安装存储依赖包..."

# 检查存储驱动类型
STORAGE_DRIVER=${1:-"local"}

case $STORAGE_DRIVER in
  "oss")
    echo "安装 OSS 依赖..."
    pnpm add ali-oss
    pnpm add @types/ali-oss -D
    echo "OSS 依赖安装完成"
    ;;
  "cdn")
    echo "安装 CDN 依赖..."
    pnpm add @aws-sdk/client-s3 @aws-sdk/client-cloudfront aws-sdk
    pnpm add @types/aws-sdk -D
    echo "CDN 依赖安装完成"
    ;;
  "local")
    echo "本地存储，无需额外依赖"
    ;;
  *)
    echo "未知的存储驱动: $STORAGE_DRIVER"
    echo "支持的驱动: local, oss, cdn"
    exit 1
    ;;
esac

echo "依赖安装完成！"
```

使用方法：

```bash
# 安装 OSS 依赖
chmod +x install-storage-deps.sh
./install-storage-deps.sh oss

# 安装 CDN 依赖
./install-storage-deps.sh cdn

# 本地存储（无需额外依赖）
./install-storage-deps.sh local
```

## 版本兼容性

### Node.js 版本要求

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.5.0

### 依赖版本建议

```json
{
  "dependencies": {
    "ali-oss": "^6.18.0",
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-cloudfront": "^3.400.0",
    "aws-sdk": "^2.1500.0",
    "sharp": "^0.34.0"
  },
  "devDependencies": {
    "@types/ali-oss": "^6.16.0",
    "@types/aws-sdk": "^2.7.0"
  }
}
```

## 测试存储服务

安装依赖后，可以使用以下 API 测试存储服务：

```bash
# 检查存储服务状态
curl http://localhost:3000/api/storage-health/status

# 检查存储配置
curl http://localhost:3000/api/storage-health/config

# 测试存储连接
curl http://localhost:3000/api/storage-health/test
```

## 故障排查

### 常见问题

1. **OSS 连接失败**
   - 检查 AccessKey 和 SecretKey 是否正确
   - 确认 OSS 区域配置正确
   - 验证存储桶是否存在

2. **AWS S3 连接失败**
   - 检查 AWS 凭证配置
   - 确认 S3 存储桶权限
   - 验证区域配置

3. **依赖安装失败**
   - 检查 Node.js 版本
   - 清理 node_modules 重新安装
   - 检查网络连接

### 调试模式

启用详细日志：

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

---

**注意**：在生产环境中使用 OSS 或 CDN 存储时，建议使用 IAM 角色而非硬编码的访问密钥，以提高安全性。

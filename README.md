# 万花电商系统 (WanFlower E-commerce System)

## 🎯 项目概述

万花电商系统是一个基于 NestJS + TypeScript + PostgreSQL + Prisma 的现代化跨境电商平台，提供完整的产品管理、订单系统、用户管理、博客系统和评论系统。

## ✨ 核心特性

### 🛍️ 电商功能
- **产品管理**: 完整的产品 CRUD 操作，支持多级分类
- **订单系统**: 从创建到完成的完整订单流程
- **购物车**: 用户购物车管理
- **库存管理**: 库存数量、预警机制

### 👥 用户系统
- **认证系统**: 双Token机制 (Access Token + Refresh Token)
- **第三方登录**: Google OAuth2 集成
- **权限控制**: 基于角色的访问控制 (USER/STAFF/ADMIN)
- **安全防护**: 邮箱验证、防暴力破解、设备管理

### 📝 内容管理
- **博客系统**: Markdown格式，支持HTML，多语言
- **评论系统**: 产品评论，支持媒体上传
- **SEO优化**: 完整的SEO字段支持

### 🎨 媒体管理
- **统一媒体管理**: 支持产品、博客、评论等所有业务场景
- **分类存储**: 按业务类型自动分类存储
- **多存储支持**: 本地存储、OSS存储、CDN存储
- **自动处理**: 缩略图生成、元数据提取

## 🏗️ 技术架构

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + OAuth2
- **存储**: 本地存储 + OSS + CDN
- **文档**: Swagger/OpenAPI

### 前端技术栈
- **管理后台**: React 19 + TypeScript + Vite + Ant Design + Tailwind CSS
- **用户端网站**: Next.js 15 + TypeScript + Tailwind CSS
- **共享包**: backend-api (API客户端), react-markdown (自定义组件)

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- Redis >= 6.0 (可选)

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd wanflower-server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

### 访问服务
- **API服务**: http://localhost:3000
- **API文档**: http://localhost:3000/api/docs
- **健康检查**: http://localhost:3000/api/storage-health/status

## 📁 项目结构

```
wanflower-server/
├── src/
│   ├── auth/                 # 认证模块
│   ├── product/              # 产品管理
│   ├── order/                # 订单系统
│   ├── user/                 # 用户管理
│   ├── blog/                 # 博客系统
│   ├── review/               # 评论系统
│   └── shared/               # 共享模块
│       ├── services/         # 共享服务
│       │   ├── media/        # 媒体管理
│       │   └── upload/       # 上传服务
│       ├── controllers/      # 共享控制器
│       └── dto/              # 数据传输对象
├── prisma/                   # 数据库模式
├── docs/                     # 项目文档
├── scripts/                  # 工具脚本
└── test-media-system.js      # 媒体系统测试脚本
```

## 🎨 媒体管理系统

### 特性
- **统一管理**: 所有媒体文件使用统一的 `Media` 表管理
- **分类存储**: 按业务类型自动分类存储 (products/, blogs/, reviews/, users/, general/)
- **多存储支持**: 支持本地存储、阿里云OSS、AWS CloudFront + S3
- **自动处理**: 自动生成缩略图、提取元数据
- **权限控制**: 基于用户和角色的权限管理

### 使用示例

```typescript
// 上传产品媒体
const formData = new FormData();
formData.append('file', file);
formData.append('product_id', '123');
formData.append('type', 'IMAGE');
formData.append('media_category', 'MAIN');

const response = await fetch('/api/product/media/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 存储配置

```bash
# 本地存储
STORAGE_DRIVER=local
IMAGE_LOCAL_UPLOAD_PATH=uploads

# OSS 存储
STORAGE_DRIVER=oss
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET=your-bucket-name

# CDN 存储
STORAGE_DRIVER=cdn
CDN_DOMAIN=your-cdn-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

## 📚 API 文档

### 产品管理
- `GET /api/product/list` - 获取产品列表
- `GET /api/product/:id` - 获取产品详情
- `POST /api/product/create` - 创建产品
- `PUT /api/product/update` - 更新产品
- `DELETE /api/product/delete` - 删除产品

### 媒体管理
- `POST /api/product/media/upload` - 上传产品媒体
- `POST /api/review/media/upload` - 上传评论媒体
- `POST /api/blog/media/upload` - 上传博客媒体
- `GET /api/media/list` - 获取媒体列表
- `DELETE /api/media/delete` - 删除媒体文件

### 用户管理
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/user/profile` - 获取用户信息

完整的 API 文档请访问: http://localhost:3000/api/docs

## 🔧 开发指南

### 代码规范
- **TypeScript**: 严格模式，完整类型定义
- **命名规范**: PascalCase (类), camelCase (变量), kebab-case (文件)
- **函数设计**: 单一职责，不超过20行
- **错误处理**: 统一异常处理，详细错误信息

### 数据库设计
- 使用 Prisma ORM 进行数据库管理
- 支持数据库迁移和版本控制
- 完整的关联关系设计

### 测试
```bash
# 运行单元测试
npm run test

# 运行集成测试
npm run test:e2e

# 测试媒体管理系统
node test-media-system.js
```

## 🚀 部署

### Docker 部署
```bash
# 构建镜像
docker build -t wanflower-server .

# 运行容器
docker run -p 3000:3000 wanflower-server
```

### 环境变量
```bash
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/wanflower"

# JWT 配置
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# 存储配置
STORAGE_DRIVER="local"
IMAGE_LOCAL_UPLOAD_PATH="uploads"
```

## 📊 监控和日志

### 健康检查
- **存储状态**: `/api/storage-health/status`
- **存储配置**: `/api/storage-health/config`
- **连接测试**: `/api/storage-health/test`

### 日志系统
- 结构化日志 (JSON格式)
- 多级别日志 (DEBUG/INFO/WARN/ERROR)
- 性能监控 (响应时间、数据库查询)
- 错误追踪 (堆栈信息、上下文)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/your-username/wanflower-server](https://github.com/your-username/wanflower-server)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和开源社区！

---

**万花电商系统** - 让电商更简单，让管理更高效！ 🌸

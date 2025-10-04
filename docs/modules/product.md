# 产品管理模块

## 概述

产品管理模块是万花电商系统的核心功能之一，提供完整的产品生命周期管理，包括产品信息管理、分类管理、媒体文件管理、库存管理等功能。

## 核心特性

### ✅ 已实现功能
- **产品CRUD操作**: 完整的增删改查功能
- **多级分类管理**: 支持无限级分类结构
- **媒体文件管理**: 图片/视频上传，支持本地存储和CDN
- **库存管理**: 库存数量、最小库存预警
- **SEO优化**: 独立的SEO字段支持
- **产品属性**: 支持自定义产品属性
- **批量操作**: 批量更新、删除、状态修改

### 🔄 计划功能
- **产品变体管理**: SKU变体支持
- **库存预警**: 自动库存预警通知
- **产品推荐**: 基于用户行为的推荐算法
- **批量导入**: Excel/CSV批量导入产品
- **产品分析**: 销售数据分析和报表

## 技术实现

### 数据库设计

产品管理模块包含以下核心表：
- **Product**: 产品基础信息，包含价格、库存、SEO等字段
- **ProductMedia**: 产品媒体文件管理，支持本地和CDN存储
- **ProductCategory**: 产品分类管理，支持多级分类结构
- **ProductAttribute**: 产品属性管理，支持自定义属性

详细表结构请参考 Prisma Schema 文件。

### API接口

产品管理模块提供以下核心接口：

#### 产品管理
- **GET /product/list** - 获取产品列表（支持筛选、排序、分页）
- **GET /product/detail/{id}** - 获取产品详情
- **POST /product/create** - 创建产品
- **PUT /product/update** - 更新产品
- **DELETE /product/delete/{id}** - 删除产品

#### 媒体文件管理
- **POST /product/media/upload** - 上传产品媒体文件
- **GET /product/media/{productId}** - 获取产品媒体文件
- **PUT /product/media/update** - 更新媒体文件信息
- **DELETE /product/media/delete** - 删除媒体文件

#### 分类管理
- **GET /product/category/list** - 获取分类列表
- **POST /product/category/create** - 创建分类
- **PUT /product/category/update** - 更新分类
- **DELETE /product/category/delete/{id}** - 删除分类

详细的API接口文档请参考 Swagger 文档。

### 服务架构

#### 核心服务
- **ProductService**: 产品业务逻辑
- **ProductMediaService**: 媒体文件管理
- **ProductCategoryService**: 分类管理
- **UploadService**: 文件上传服务

#### 控制器
- **ProductController**: 产品相关接口
- **ProductMediaController**: 媒体文件接口
- **ProductCategoryController**: 分类管理接口

### 权限控制

#### 权限级别
- **公开接口**: 产品查询、分类查询、媒体查看
- **员工权限**: 产品管理、媒体上传、分类管理
- **管理员权限**: 批量操作、系统配置

#### 权限装饰器
```typescript
@Roles('STAFF', 'ADMIN')  // 员工和管理员
@Roles('ADMIN')           // 仅管理员
@Public()                 // 公开接口
```

### 媒体文件管理

#### 存储策略
- **本地存储**: 开发环境，成本低
- **CDN存储**: 生产环境，全球加速
- **双存储**: 支持平滑迁移

#### 文件限制
- **图片**: 最大5MB，支持JPEG/PNG/WebP/GIF
- **视频**: 最大50MB，最长60秒，支持MP4/WebM
- **数量**: 每个产品最多50个媒体文件

#### 安全验证
```typescript
// 文件类型验证
const allowedMimeTypes = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime']
};

// 文件大小验证
const maxSizes = {
  IMAGE: 5 * 1024 * 1024,  // 5MB
  VIDEO: 50 * 1024 * 1024  // 50MB
};
```

### 错误处理

#### 常见错误码
- `PRODUCT_001`: 产品不存在
- `PRODUCT_002`: 产品名称已存在
- `PRODUCT_003`: SKU已存在
- `PRODUCT_004`: 分类不存在
- `PRODUCT_005`: 库存不足
- `MEDIA_001`: 文件类型不支持
- `MEDIA_002`: 文件过大
- `MEDIA_003`: 文件上传失败

### 配置说明

#### 环境变量
```env
# 文件上传配置
MAX_FILE_SIZE=52428800
UPLOAD_PATH=uploads
CDN_URL=https://cdn.example.com

# 产品配置
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

### 监控和日志

#### 日志记录
- 产品创建、更新、删除
- 媒体文件上传、删除
- 分类管理操作
- 批量操作记录

#### 监控指标
- 产品数量统计
- 媒体文件存储使用量
- 接口响应时间
- 错误率统计

### 测试策略

#### 单元测试
- 服务层业务逻辑测试
- 文件上传功能测试
- 数据验证测试

#### 集成测试
- API接口测试
- 数据库操作测试
- 文件存储测试

#### E2E测试
- 完整产品管理流程
- 媒体文件上传流程
- 权限控制测试

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [数据库设计](../architecture/database.md)
- [API设计规范](../architecture/api-standards.md)


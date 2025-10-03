# 万花电商系统 - 产品API接口设计文档

## 概述

本文档详细描述了万花电商系统产品模块的API接口设计，包含完整的权限控制、媒体文件管理、产品分类管理等功能。

## 权限说明

### 权限级别
- **无权限**：公开接口，任何人都可以访问
- **用户权限**：需要登录的普通用户
- **员工权限**：需要员工(staff)或管理员(admin)权限
- **管理员权限**：仅管理员(admin)可访问

### 权限标识
- 🌍 **公开接口** - 无需权限
- 🔐 **员工权限** - 需要员工或管理员权限
- 👑 **管理员权限** - 仅管理员权限

---

## 产品管理接口

### 1. 产品查询接口

#### 1.1 获取产品列表 🌍
```http
GET /product/list
```

**功能描述**：获取产品列表，支持筛选、排序、分页

**查询参数**：
```typescript
{
  page?: number;              // 页码，默认1
  page_size?: number;         // 每页数量，默认10
  price_order?: 'asc' | 'desc';    // 价格排序
  sales_order?: 'asc' | 'desc';    // 销量排序
  view_order?: 'asc' | 'desc';     // 浏览量排序
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';  // 状态筛选
  category_id?: number;       // 分类ID筛选
  keyword?: string;           // 关键词搜索
  min_price?: number;         // 最低价格
  max_price?: number;         // 最高价格
}
```

**响应示例**：
```json
{
  "records": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "description": "最新款iPhone",
      "short_desc": "强大的A17芯片",
      "price": 7999.00,
      "original_price": 8999.00,
      "stock": 100,
      "sales_count": 50,
      "view_count": 1000,
      "status": "ACTIVE",
      "category": {
        "id": 1,
        "name": "手机",
        "slug": "phones"
      },
      "media": [
        {
          "id": 1,
          "type": "IMAGE",
          "storage_type": "LOCAL",
          "local_path": "/uploads/iphone15.jpg",
          "alt_text": "iPhone 15 Pro 主图"
        }
      ],
      "attributes": [
        {
          "id": 1,
          "name": "颜色",
          "value": "深空黑",
          "sort_order": 0
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

#### 1.2 获取产品详情 🌍
```http
GET /product/detail/{id}
```

**路径参数**：
- `id` (number): 产品ID

**响应示例**：
```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "description": "详细的产品描述...",
  "short_desc": "简短描述",
  "price": 7999.00,
  "original_price": 8999.00,
  "stock": 100,
  "weight": 0.187,
  "dimensions": {
    "length": 14.67,
    "width": 7.09,
    "height": 0.83,
    "unit": "cm"
  },
  "sku": "IPHONE15PRO-256GB-BLACK",
  "barcode": "1234567890123",
  "status": "ACTIVE",
  "category": {
    "id": 1,
    "name": "手机",
    "slug": "phones"
  },
  "media": [
    {
      "id": 1,
      "type": "IMAGE",
      "storage_type": "LOCAL",
      "local_path": "/uploads/iphone15-main.jpg",
      "media_category": "MAIN",
      "sort_order": 0
    }
  ],
  "attributes": [
    {
      "id": 1,
      "name": "颜色",
      "value": "深空黑"
    }
  ],
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "content": "非常好用的手机",
      "helpful_count": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "username": "用户1",
        "avatar_url": "/avatars/user1.jpg"
      }
    }
  ],
  "seo_title": "iPhone 15 Pro - 最新款苹果手机",
  "seo_description": "iPhone 15 Pro 搭载A17芯片...",
  "seo_keywords": ["iPhone", "苹果", "手机"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 1.3 增加产品浏览量 🌍
```http
POST /product/view
```

**请求体**：
```json
{
  "id": 1
}
```

**响应**：
```json
{
  "success": true,
  "view_count": 1001
}
```

### 2. 产品管理接口

#### 2.1 创建产品 🔐
```http
POST /product/create
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "name": "iPhone 15 Pro",
  "description": "详细描述",
  "short_desc": "简短描述",
  "price": 7999.00,
  "original_price": 8999.00,
  "stock": 100,
  "min_stock": 10,
  "weight": 0.187,
  "dimensions": {
    "length": 14.67,
    "width": 7.09,
    "height": 0.83,
    "unit": "cm"
  },
  "sku": "IPHONE15PRO-256GB-BLACK",
  "barcode": "1234567890123",
  "status": "ACTIVE",
  "category_id": 1,
  "sort_order": 0,
  "seo_title": "iPhone 15 Pro",
  "seo_description": "最新款iPhone",
  "seo_keywords": ["iPhone", "苹果"],
  "attributes": [
    {
      "name": "颜色",
      "value": "深空黑",
      "sort_order": 0
    }
  ]
}
```

#### 2.2 更新产品 🔐
```http
PUT /product/update
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "name": "iPhone 15 Pro Max",
  "price": 8999.00,
  // ... 其他可选字段
}
```

#### 2.3 删除产品 🔐
```http
DELETE /product/delete/{id}
Authorization: Bearer {token}
```

**路径参数**：
- `id` (number): 产品ID

#### 2.4 批量删除产品 🔐
```http
POST /product/batch-delete
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

#### 2.5 批量更新产品状态 🔐
```http
POST /product/batch-update-status
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "ids": [1, 2, 3],
  "status": "INACTIVE"
}
```

---

## 媒体文件管理接口

### 3. 媒体文件接口

#### 3.1 获取产品媒体文件 🌍
```http
GET /product/media/{productId}
```

**路径参数**：
- `productId` (number): 产品ID

**响应示例**：
```json
[
  {
    "id": 1,
    "type": "IMAGE",
    "storage_type": "LOCAL",
    "local_path": "/uploads/product1-main.jpg",
    "cdn_url": null,
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "width": 800,
    "height": 600,
    "media_category": "MAIN",
    "sort_order": 0,
    "url": "/uploads/product1-main.jpg",
    "thumbnail_url": "/uploads/product1-main.jpg"
  }
]
```

#### 3.2 上传产品媒体文件 🔐
```http
POST /product/media/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**表单数据**：
```
file: (文件)
product_id: 1
type: IMAGE
media_category: MAIN
sort_order: 0
alt_text: 产品主图
```

**文件限制**：
- 图片：最大5MB，支持JPEG/PNG/WebP/GIF
- 视频：最大50MB，最长60秒，支持MP4/WebM

#### 3.3 批量上传媒体文件 🔐
```http
POST /product/media/batch-upload/{productId}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**表单数据**：
```
files: (多个文件)
type: IMAGE
```

#### 3.4 更新媒体文件信息 🔐
```http
PUT /product/media/update
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "media_category": "GALLERY",
  "sort_order": 1,
  "alt_text": "产品展示图"
}
```

#### 3.5 删除媒体文件 🔐
```http
DELETE /product/media/delete
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1
}
```

### 4. CDN迁移接口

#### 4.1 迁移媒体文件到CDN 👑
```http
POST /product/media/migrate-to-cdn
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "cdn_url": "https://cdn.example.com/products/image1.jpg",
  "cdn_key": "products/1/image1.jpg"
}
```

#### 4.2 批量迁移产品媒体到CDN 👑
```http
POST /product/media/batch-migrate-to-cdn/{productId}
Authorization: Bearer {token}
```

**路径参数**：
- `productId` (number): 产品ID

---

## 产品分类管理接口

### 5. 分类管理接口

#### 5.1 获取分类列表 🌍
```http
GET /product/category/list
```

**查询参数**：
```typescript
{
  page?: number;
  page_size?: number;
  parent_id?: number;    // 父分类ID，null获取顶级分类
  is_active?: boolean;   // 是否启用
}
```

**响应示例**：
```json
{
  "records": [
    {
      "id": 1,
      "name": "电子产品",
      "slug": "electronics",
      "description": "各类电子产品",
      "image_url": "/categories/electronics.jpg",
      "parent_id": null,
      "sort_order": 0,
      "is_active": true,
      "parent": null,
      "children": [
        {
          "id": 2,
          "name": "手机",
          "slug": "phones",
          "is_active": true
        }
      ],
      "_count": {
        "products": 50
      }
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 10
}
```

#### 5.2 创建分类 🔐
```http
POST /product/category/create
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "name": "智能手机",
  "slug": "smartphones",
  "description": "各品牌智能手机",
  "image_url": "https://example.com/category.jpg",
  "parent_id": 1,
  "sort_order": 0,
  "is_active": true
}
```

#### 5.3 更新分类 🔐
```http
PUT /product/category/update
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "name": "电子设备",
  "description": "更新后的描述"
}
```

#### 5.4 删除分类 👑
```http
DELETE /product/category/delete/{id}
Authorization: Bearer {token}
```

**路径参数**：
- `id` (number): 分类ID

**删除条件**：
- 分类下不能有产品
- 分类下不能有子分类

---

## 错误响应

### 通用错误格式
```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

### 常见错误码

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未登录或token无效 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 413 | Payload Too Large | 文件过大 |
| 415 | Unsupported Media Type | 不支持的文件类型 |
| 422 | Unprocessable Entity | 数据验证失败 |
| 500 | Internal Server Error | 服务器内部错误 |

### 具体错误示例

#### 权限不足
```json
{
  "statusCode": 403,
  "message": "You do not have permission",
  "error": "Forbidden"
}
```

#### 产品不存在
```json
{
  "statusCode": 404,
  "message": "产品不存在",
  "error": "Not Found"
}
```

#### 文件过大
```json
{
  "statusCode": 400,
  "message": "图片文件大小不能超过 5MB",
  "error": "Bad Request"
}
```

#### SKU重复
```json
{
  "statusCode": 400,
  "message": "SKU已存在",
  "error": "Bad Request"
}
```

---

## 数据验证规则

### 产品数据验证

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| name | string | ✓ | 1-255字符 |
| description | string | ✓ | 不限长度 |
| short_desc | string | ✗ | 最大500字符 |
| price | number | ✓ | ≥0，最多2位小数 |
| original_price | number | ✗ | ≥0，最多2位小数 |
| stock | number | ✓ | ≥0的整数 |
| min_stock | number | ✗ | ≥0的整数 |
| weight | number | ✗ | ≥0，最多3位小数 |
| sku | string | ✗ | 1-100字符，唯一 |
| barcode | string | ✗ | 1-100字符 |
| status | enum | ✓ | ACTIVE/INACTIVE/DRAFT |
| category_id | number | ✗ | 存在的分类ID |
| seo_keywords | array | ✗ | 最多20个关键词 |
| attributes | array | ✗ | 最多50个属性 |

### 媒体文件验证

| 类型 | 最大大小 | 支持格式 | 特殊限制 |
|------|----------|----------|----------|
| 图片 | 5MB | JPEG, PNG, WebP, GIF | - |
| 视频 | 50MB | MP4, WebM | 最长60秒 |

### 分类数据验证

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| name | string | ✓ | 1-100字符 |
| slug | string | ✓ | 1-100字符，唯一，URL友好 |
| description | string | ✗ | 不限长度 |
| image_url | string | ✗ | 有效URL格式 |
| parent_id | number | ✗ | 存在的分类ID，不能是自己 |

---

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取产品列表
const getProducts = async (params: {
  page?: number;
  category_id?: number;
  keyword?: string;
}) => {
  const query = new URLSearchParams(params as any).toString();
  const response = await fetch(`/api/product/list?${query}`);
  return response.json();
};

// 创建产品（需要权限）
const createProduct = async (productData: any, token: string) => {
  const response = await fetch('/api/product/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return response.json();
};

// 上传产品图片
const uploadProductImage = async (
  file: File, 
  productId: number, 
  token: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('product_id', productId.toString());
  formData.append('type', 'IMAGE');
  formData.append('media_category', 'MAIN');

  const response = await fetch('/api/product/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### cURL 示例

```bash
# 获取产品列表
curl -X GET "http://localhost:3000/api/product/list?page=1&page_size=10&keyword=iPhone"

# 创建产品
curl -X POST "http://localhost:3000/api/product/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "最新款iPhone",
    "price": 7999.00,
    "stock": 100,
    "status": "ACTIVE"
  }'

# 上传产品图片
curl -X POST "http://localhost:3000/api/product/media/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "product_id=1" \
  -F "type=IMAGE" \
  -F "media_category=MAIN"
```

---

## 最佳实践

### 1. 性能优化建议

- **分页查询**：列表接口必须使用分页，避免一次性加载大量数据
- **图片优化**：上传图片时自动压缩和生成缩略图
- **缓存策略**：对热点产品数据进行Redis缓存
- **CDN加速**：媒体文件使用CDN加速访问

### 2. 安全建议

- **文件验证**：严格验证上传文件的类型和大小
- **权限控制**：敏感操作必须验证用户权限
- **数据验证**：所有输入数据都要进行验证
- **SQL注入防护**：使用ORM避免SQL注入

### 3. 业务建议

- **SKU管理**：确保SKU的唯一性，便于库存管理
- **软删除**：产品删除使用软删除，保留历史数据
- **媒体管理**：支持本地存储到CDN的平滑迁移
- **SEO优化**：完善产品的SEO信息，提升搜索排名

### 4. 监控建议

- **接口监控**：监控接口响应时间和错误率
- **文件监控**：监控文件上传成功率和存储使用情况
- **业务监控**：监控产品浏览量、转化率等业务指标

---

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 完成产品基础CRUD接口
- ✅ 实现媒体文件管理功能
- ✅ 支持产品分类管理
- ✅ 完善权限控制系统
- ✅ 支持本地存储和CDN双重存储策略

### 待开发功能
- 🔄 产品库存预警功能
- 🔄 产品批量导入/导出
- 🔄 产品变体管理（SKU变体）
- 🔄 产品推荐算法
- 🔄 产品搜索优化（Elasticsearch）

---

## 联系方式

如有问题或建议，请联系开发团队：
- 邮箱：dev@wanflower.com
- 文档版本：v1.0.0
- 最后更新：2024-01-01

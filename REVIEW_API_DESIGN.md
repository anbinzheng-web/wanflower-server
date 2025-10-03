# 万花电商系统 - 评论API接口设计文档

## 概述

本文档详细描述了万花电商系统评论模块的API接口设计，特别注重安全性防护，包含完整的权限控制、内容审核、媒体文件管理等功能。

## 🔒 安全防护措施

### 核心安全原则
- **永不信任前端数据**：所有来自前端的数据都进行严格验证和清理
- **多层防护**：DTO验证 + 服务层验证 + 数据库约束
- **权限最小化**：用户只能操作自己的数据
- **内容审核**：所有评论默认需要审核才能显示

### 安全防护技术

#### 1. SQL注入防护
```typescript
// ✅ 使用Prisma ORM，自动防止SQL注入
const reviews = await this.prisma.productReview.findMany({
  where: { product_id: productId } // 参数化查询
});

// ❌ 避免原生SQL拼接
// const sql = `SELECT * FROM reviews WHERE product_id = ${productId}`;
```

#### 2. XSS攻击防护
```typescript
// DTO层自动清理HTML标签
@Transform(({ value }) => {
  return typeof value === 'string' ? 
    value.replace(/<[^>]*>/g, '').trim() : value;
})
content: string;

// 服务层二次清理
private sanitizeContent(content: string): string {
  let sanitized = content.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/[<>'"%;()&+]/g, '');
  return sanitized.replace(/\s+/g, ' ').trim();
}
```

#### 3. 文件上传安全
```typescript
// 严格的文件类型验证
const allowedMimeTypes = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime']
};

// 文件大小限制
const maxSizes = {
  IMAGE: 5 * 1024 * 1024,  // 5MB
  VIDEO: 50 * 1024 * 1024  // 50MB
};

// 文件名安全检查
if (/[<>:"/\\|?*]/.test(filename)) {
  throw new BadRequestException('文件名包含非法字符');
}
```

#### 4. 权限验证
```typescript
// 验证评论所有权
const review = await this.prisma.productReview.findFirst({
  where: { 
    id: reviewId,
    user_id: userId, // 确保只能操作自己的评论
    deleted_at: null
  }
});
```

---

## 权限说明

### 权限级别
- **🌍 公开接口**：无需权限，任何人都可以访问
- **🔐 用户权限**：需要登录的普通用户
- **👥 员工权限**：需要员工(staff)或管理员(admin)权限
- **👑 管理员权限**：仅管理员(admin)可访问

---

## 评论管理接口

### 1. 公开查询接口

#### 1.1 获取产品评论列表 🌍
```http
GET /review/list
```

**功能描述**：获取产品的已审核评论列表，支持筛选和排序

**查询参数**：
```typescript
{
  page?: number;                    // 页码，默认1
  page_size?: number;               // 每页数量，默认10
  product_id: number;               // 产品ID（必填）
  rating?: 1 | 2 | 3 | 4 | 5;     // 评分筛选
  status?: 'APPROVED';              // 状态筛选（公开接口只显示已审核）
  has_media?: boolean;              // 是否有媒体文件
  sort_by?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
}
```

**响应示例**：
```json
{
  "records": [
    {
      "id": 1,
      "product_id": 100,
      "user_id": 1,
      "order_id": 50,
      "rating": 5,
      "content": "非常好用的产品，质量很棒！",
      "helpful_count": 15,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "username": "用户1",
        "avatar_url": "/avatars/user1.jpg"
      },
      "media": [
        {
          "id": 1,
          "type": "IMAGE",
          "storage_type": "LOCAL",
          "url": "/uploads/review_image1.jpg",
          "thumbnail_url": "/uploads/review_image1.jpg",
          "sort_order": 0
        }
      ],
      "replies": [
        {
          "id": 2,
          "content": "感谢您的好评！",
          "created_at": "2024-01-02T00:00:00Z",
          "user": {
            "id": 2,
            "username": "客服小王"
          }
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

#### 1.2 获取评论详情 🌍
```http
GET /review/detail/{id}
```

**路径参数**：
- `id` (number): 评论ID

**响应示例**：
```json
{
  "id": 1,
  "product_id": 100,
  "rating": 5,
  "content": "详细的评论内容...",
  "helpful_count": 15,
  "user": {
    "id": 1,
    "username": "用户1",
    "avatar_url": "/avatars/user1.jpg"
  },
  "product": {
    "id": 100,
    "name": "iPhone 15 Pro"
  },
  "media": [
    {
      "id": 1,
      "type": "IMAGE",
      "url": "/uploads/review_image1.jpg",
      "thumbnail_url": "/uploads/review_image1.jpg"
    }
  ],
  "replies": [],
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 1.3 获取产品评论统计 🌍
```http
GET /review/stats/{productId}
```

**路径参数**：
- `productId` (number): 产品ID

**响应示例**：
```json
{
  "total_reviews": 150,
  "average_rating": 4.2,
  "rating_distribution": [
    { "rating": 5, "count": 80 },
    { "rating": 4, "count": 40 },
    { "rating": 3, "count": 20 },
    { "rating": 2, "count": 7 },
    { "rating": 1, "count": 3 }
  ]
}
```

#### 1.4 获取评论媒体文件 🌍
```http
GET /review/media/{reviewId}
```

**路径参数**：
- `reviewId` (number): 评论ID

**响应示例**：
```json
[
  {
    "id": 1,
    "type": "IMAGE",
    "storage_type": "LOCAL",
    "file_size": 1024000,
    "width": 800,
    "height": 600,
    "url": "/uploads/review_image1.jpg",
    "thumbnail_url": "/uploads/review_image1.jpg",
    "sort_order": 0
  }
]
```

### 2. 用户操作接口

#### 2.1 创建评论 🔐
```http
POST /review/create
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 验证用户登录状态
- ✅ 验证订单所有权（必须是用户的已完成订单）
- ✅ 验证产品在订单中存在
- ✅ 防止重复评论
- ✅ 内容XSS过滤

**请求体**：
```json
{
  "product_id": 100,
  "order_id": 50,
  "rating": 5,
  "content": "非常好用的产品，推荐购买！",
  "parent_id": null
}
```

**业务规则**：
- 评论内容长度：10-2000字符
- 评分范围：1-5星
- 只能评论已完成订单中的产品
- 每个订单中的每个产品只能评论一次
- 新评论默认为待审核状态

#### 2.2 更新评论 🔐
```http
PUT /review/update
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 验证评论所有权
- ✅ 只能修改待审核或已拒绝的评论
- ✅ 内容安全过滤

**请求体**：
```json
{
  "id": 1,
  "rating": 4,
  "content": "修改后的评论内容"
}
```

#### 2.3 删除评论 🔐
```http
DELETE /review/delete
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 验证评论所有权
- ✅ 软删除，保留数据

**请求体**：
```json
{
  "id": 1,
  "delete_reason": "不想要这个评论了"
}
```

#### 2.4 评论有用性投票 🔐
```http
POST /review/vote-helpful
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 不能给自己的评论投票
- ✅ 每个用户对每条评论只能投票一次

**请求体**：
```json
{
  "review_id": 1,
  "is_helpful": true
}
```

#### 2.5 举报评论 🔐
```http
POST /review/report
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 不能举报自己的评论
- ✅ 防止重复举报
- ✅ 内容安全过滤

**请求体**：
```json
{
  "review_id": 1,
  "reason": "spam",
  "description": "这是垃圾评论"
}
```

### 3. 媒体文件管理接口

#### 3.1 上传评论媒体文件 🔐
```http
POST /review/media/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**安全验证**：
- ✅ 验证评论所有权
- ✅ 严格的文件类型验证
- ✅ 文件大小限制
- ✅ 文件名安全检查
- ✅ 数量限制（图片9张，视频3个）

**表单数据**：
```
file: (文件)
review_id: 1
type: IMAGE
sort_order: 0
```

**文件限制**：
- **图片**：最大5MB，支持JPEG/PNG/WebP/GIF，最多9张
- **视频**：最大50MB，最长60秒，支持MP4/WebM，最多3个

#### 3.2 批量上传媒体文件 🔐
```http
POST /review/media/batch-upload/{reviewId}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**表单数据**：
```
files: (多个文件)
type: IMAGE
```

#### 3.3 更新媒体文件信息 🔐
```http
PUT /review/media/update
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "sort_order": 1
}
```

#### 3.4 删除媒体文件 🔐
```http
DELETE /review/media/delete
Authorization: Bearer {token}
```

**安全验证**：
- ✅ 验证文件所有权
- ✅ 同时删除本地文件

**请求体**：
```json
{
  "id": 1
}
```

#### 3.5 获取我的评论媒体文件 🔐
```http
GET /review/my-media/{reviewId}
Authorization: Bearer {token}
```

**用途**：用于编辑评论时获取已上传的媒体文件

### 4. 管理员接口

#### 4.1 管理员获取评论列表 👥
```http
GET /review/admin/list
Authorization: Bearer {token}
```

**查询参数**：
```typescript
{
  page?: number;
  page_size?: number;
  product_id?: number;              // 产品ID筛选
  user_id?: number;                 // 用户ID筛选
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating?: 1 | 2 | 3 | 4 | 5;
  keyword?: string;                 // 关键词搜索（已安全过滤）
  date_from?: string;               // 日期范围 YYYY-MM-DD
  date_to?: string;
}
```

**响应示例**：
```json
{
  "records": [
    {
      "id": 1,
      "product_id": 100,
      "rating": 5,
      "content": "评论内容",
      "status": "PENDING",
      "user": {
        "id": 1,
        "username": "用户1",
        "email": "user1@example.com"
      },
      "product": {
        "id": 100,
        "name": "iPhone 15 Pro"
      },
      "order": {
        "id": 50,
        "order_number": "ORD20240101001"
      },
      "media": [
        {
          "id": 1,
          "type": "IMAGE",
          "storage_type": "LOCAL"
        }
      ],
      "_count": {
        "replies": 2
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 10
}
```

#### 4.2 审核评论 👥
```http
POST /review/admin/moderate
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "id": 1,
  "status": "APPROVED",
  "moderation_note": "内容符合规范"
}
```

#### 4.3 批量审核评论 👥
```http
POST /review/admin/batch-moderate
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "ids": [1, 2, 3, 4, 5],
  "status": "APPROVED",
  "moderation_note": "批量通过审核"
}
```

**限制**：一次最多处理50条评论

#### 4.4 管理员删除媒体文件 👑
```http
DELETE /review/admin/media/{mediaId}
Authorization: Bearer {token}
```

**路径参数**：
- `mediaId` (number): 媒体文件ID

---

## 安全防护详解

### 1. 输入验证与清理

#### DTO层验证
```typescript
@Length(10, 2000, { message: '评论内容长度必须在10-2000字符之间' })
@Transform(({ value }) => {
  // 自动清理HTML标签，防止XSS攻击
  return typeof value === 'string' ? 
    value.replace(/<[^>]*>/g, '').trim() : value;
})
content: string;
```

#### 关键词搜索安全
```typescript
@Transform(({ value }) => {
  // 去除特殊字符，防止SQL注入
  return typeof value === 'string' ? 
    value.replace(/[<>'"%;()&+]/g, '').trim() : value;
})
keyword?: string;
```

#### 日期格式验证
```typescript
@Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必须为YYYY-MM-DD' })
date_from?: string;
```

### 2. 权限控制

#### 用户权限验证
```typescript
// 验证评论所有权
const review = await this.prisma.productReview.findFirst({
  where: { 
    id: reviewId,
    user_id: userId, // 确保只能操作自己的评论
    deleted_at: null
  }
});

if (!review) {
  throw new NotFoundException('评论不存在或无权限操作');
}
```

#### 购买验证
```typescript
// 验证订单所有权和完成状态
const order = await this.prisma.order.findFirst({
  where: {
    id: order_id,
    user_id: userId,
    status: 'COMPLETED' // 只有已完成的订单才能评论
  },
  include: {
    items: {
      where: { product_id },
      select: { id: true }
    }
  }
});

if (!order || order.items.length === 0) {
  throw new BadRequestException('订单不存在、未完成或不包含此产品');
}
```

### 3. 文件上传安全

#### 文件类型验证
```typescript
const allowedMimeTypes = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime']
};

if (!allowedMimeTypes[type].includes(file.mimetype)) {
  throw new BadRequestException(`不支持的文件格式: ${file.mimetype}`);
}
```

#### 文件名安全检查
```typescript
const filename = file.originalname;
if (!filename || /[<>:"/\\|?*]/.test(filename)) {
  throw new BadRequestException('文件名包含非法字符');
}
```

#### 文件扩展名验证
```typescript
const ext = path.extname(filename).toLowerCase();
const allowedExtensions = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  VIDEO: ['.mp4', '.webm', '.mov']
};

if (!allowedExtensions[type].includes(ext)) {
  throw new BadRequestException(`不支持的文件扩展名: ${ext}`);
}
```

### 4. 业务逻辑安全

#### 防止重复操作
```typescript
// 防止重复评论
const existingReview = await this.prisma.productReview.findFirst({
  where: {
    product_id,
    user_id: userId,
    order_id,
    deleted_at: null
  }
});

if (existingReview) {
  throw new BadRequestException('您已经对此产品进行过评论');
}
```

#### 防止自我操作
```typescript
// 不能给自己的评论投票
if (review.user_id === userId) {
  throw new BadRequestException('不能给自己的评论投票');
}

// 不能举报自己的评论
if (review.user_id === userId) {
  throw new BadRequestException('不能举报自己的评论');
}
```

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

### 安全相关错误

#### 权限不足
```json
{
  "statusCode": 403,
  "message": "无权限操作此评论",
  "error": "Forbidden"
}
```

#### 内容安全
```json
{
  "statusCode": 400,
  "message": "评论内容包含非法字符",
  "error": "Bad Request"
}
```

#### 文件安全
```json
{
  "statusCode": 400,
  "message": "不支持的文件格式: application/exe",
  "error": "Bad Request"
}
```

#### 业务规则
```json
{
  "statusCode": 400,
  "message": "您已经对此产品进行过评论",
  "error": "Bad Request"
}
```

---

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取产品评论列表
const getProductReviews = async (productId: number, params?: {
  rating?: number;
  sort_by?: string;
  page?: number;
}) => {
  const query = new URLSearchParams({
    product_id: productId.toString(),
    ...params
  } as any).toString();
  
  const response = await fetch(`/api/review/list?${query}`);
  return response.json();
};

// 创建评论（需要登录）
const createReview = async (reviewData: {
  product_id: number;
  order_id: number;
  rating: number;
  content: string;
}, token: string) => {
  const response = await fetch('/api/review/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// 上传评论图片
const uploadReviewImage = async (
  file: File, 
  reviewId: number, 
  token: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('review_id', reviewId.toString());
  formData.append('type', 'IMAGE');

  const response = await fetch('/api/review/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// 评论投票
const voteReviewHelpful = async (
  reviewId: number, 
  isHelpful: boolean, 
  token: string
) => {
  const response = await fetch('/api/review/vote-helpful', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      review_id: reviewId,
      is_helpful: isHelpful
    })
  });
  
  return response.json();
};
```

### cURL 示例

```bash
# 获取产品评论列表
curl -X GET "http://localhost:3000/api/review/list?product_id=100&rating=5&sort_by=helpful"

# 创建评论
curl -X POST "http://localhost:3000/api/review/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 100,
    "order_id": 50,
    "rating": 5,
    "content": "非常好用的产品，推荐购买！"
  }'

# 上传评论图片
curl -X POST "http://localhost:3000/api/review/media/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "review_id=1" \
  -F "type=IMAGE"

# 管理员审核评论
curl -X POST "http://localhost:3000/api/review/admin/moderate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "id": 1,
    "status": "APPROVED",
    "moderation_note": "内容符合规范"
  }'
```

---

## 最佳实践

### 1. 安全建议

- **输入验证**：对所有用户输入进行严格验证和清理
- **权限控制**：确保用户只能操作自己的数据
- **文件安全**：严格验证上传文件的类型、大小和内容
- **内容审核**：所有评论默认需要审核
- **防重复**：防止用户重复提交相同操作

### 2. 性能优化

- **分页查询**：所有列表接口都使用分页
- **索引优化**：在常用查询字段上建立索引
- **缓存策略**：对热点评论数据进行缓存
- **异步处理**：媒体文件处理使用异步队列

### 3. 用户体验

- **实时反馈**：操作结果及时反馈给用户
- **错误提示**：友好的错误提示信息
- **进度显示**：文件上传显示进度
- **预览功能**：支持媒体文件预览

### 4. 监控建议

- **安全监控**：监控异常请求和攻击尝试
- **性能监控**：监控接口响应时间
- **业务监控**：监控评论数量、审核效率等指标
- **错误监控**：及时发现和处理系统错误

---

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 完成评论基础CRUD接口
- ✅ 实现严格的安全防护措施
- ✅ 支持媒体文件上传和管理
- ✅ 完善权限控制系统
- ✅ 实现评论审核机制
- ✅ 支持评论有用性投票
- ✅ 实现举报功能

### 待开发功能
- 🔄 评论敏感词过滤
- 🔄 评论情感分析
- 🔄 智能审核机制
- 🔄 评论推荐算法
- 🔄 评论数据分析

---

## 联系方式

如有问题或建议，请联系开发团队：
- 邮箱：dev@wanflower.com
- 文档版本：v1.0.0
- 最后更新：2024-01-01

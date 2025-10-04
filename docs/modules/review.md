# 评论系统模块

## 概述

评论系统模块提供完整的产品评论功能，特别注重安全性防护，包含权限控制、内容审核、媒体文件管理等功能，确保评论内容的安全性和真实性。

## 核心特性

### ✅ 已实现功能
- **购买验证**: 必须关联订单，确保用户购买过才能评论
- **评分系统**: 1-5星评分机制
- **回复功能**: 支持多级回复结构
- **审核机制**: 待审核、已通过、已拒绝状态管理
- **有用性统计**: 评论有用性投票统计
- **媒体管理**: 评论图片/视频上传和管理
- **举报功能**: 用户举报不当评论
- **安全防护**: 多层安全防护机制

### 🔄 计划功能
- **敏感词过滤**: 自动过滤敏感内容
- **情感分析**: 评论情感倾向分析
- **智能审核**: 基于AI的自动审核
- **推荐算法**: 评论推荐算法
- **数据分析**: 评论数据分析和报表

## 技术实现

### 数据库设计

评论系统模块包含以下核心表：
- **ProductReview**: 产品评论，包含评分、内容、审核状态等
- **ReviewMedia**: 评论媒体文件，支持图片和视频上传
- **ReviewVote**: 评论投票，支持有用性投票
- **ReviewReport**: 评论举报，支持用户举报不当评论

详细表结构请参考 Prisma Schema 文件。

### API接口

评论系统模块提供以下核心接口：

#### 公开查询接口
- **GET /review/list** - 获取评论列表（支持筛选、排序、分页）
- **GET /review/detail/{id}** - 获取评论详情
- **GET /review/stats/{productId}** - 获取产品评论统计
- **GET /review/media/{reviewId}** - 获取评论媒体文件

#### 用户操作接口
- **POST /review/create** - 创建评论
- **PUT /review/update** - 更新评论
- **DELETE /review/delete** - 删除评论
- **POST /review/vote-helpful** - 评论投票
- **POST /review/report** - 举报评论

#### 媒体文件管理
- **POST /review/media/upload** - 上传评论媒体文件
- **POST /review/media/batch-upload/{reviewId}** - 批量上传媒体文件
- **PUT /review/media/update** - 更新媒体文件信息
- **DELETE /review/media/delete** - 删除媒体文件

#### 管理员接口
- **GET /review/admin/list** - 管理员获取评论列表
- **POST /review/admin/moderate** - 审核评论
- **POST /review/admin/batch-moderate** - 批量审核评论
- **DELETE /review/admin/media/{mediaId}** - 管理员删除媒体文件

详细的API接口文档请参考 Swagger 文档。

### 安全防护

#### 输入验证与清理
```typescript
// DTO层验证
@Length(10, 2000, { message: '评论内容长度必须在10-2000字符之间' })
@Transform(({ value }) => {
  // 自动清理HTML标签，防止XSS攻击
  return typeof value === 'string' ? 
    value.replace(/<[^>]*>/g, '').trim() : value;
})
content: string;

// 关键词搜索安全
@Transform(({ value }) => {
  // 去除特殊字符，防止SQL注入
  return typeof value === 'string' ? 
    value.replace(/[<>'"%;()&+]/g, '').trim() : value;
})
keyword?: string;
```

#### 权限控制
```typescript
// 验证评论所有权
const review = await this.prisma.productReview.findFirst({
  where: { 
    id: reviewId,
    user_id: userId, // 确保只能操作自己的评论
    deleted_at: null
  }
});

// 购买验证
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
```

#### 文件上传安全
```typescript
// 文件类型验证
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

### 服务架构

#### 核心服务
- **ReviewService**: 评论业务逻辑
- **ReviewMediaService**: 媒体文件管理
- **ReviewModerationService**: 审核管理
- **ReviewVoteService**: 投票管理

#### 控制器
- **ReviewController**: 评论相关接口
- **ReviewMediaController**: 媒体文件接口
- **ReviewAdminController**: 管理员接口

### 业务规则

#### 评论规则
1. **购买验证**: 必须有已完成的订单才能评论
2. **内容长度**: 评论内容10-2000字符
3. **评分范围**: 1-5星评分
4. **重复限制**: 每个订单中的每个产品只能评论一次
5. **审核机制**: 新评论默认为待审核状态

#### 媒体规则
1. **文件限制**:
   - 图片：JPEG/PNG/WebP/GIF，最大5MB，最多9张
   - 视频：MP4/WebM，最大50MB，最长60秒，最多3个
2. **安全验证**: 严格的文件类型和大小验证
3. **存储策略**: 支持本地存储和CDN存储

#### 投票规则
1. **自我限制**: 不能给自己的评论投票
2. **重复限制**: 每个用户对每条评论只能投票一次
3. **权限验证**: 只有登录用户才能投票

### 错误处理

#### 常见错误码
- `REVIEW_001`: 评论不存在
- `REVIEW_002`: 无权限操作此评论
- `REVIEW_003`: 订单不存在或未完成
- `REVIEW_004`: 已经评论过此产品
- `REVIEW_005`: 评论内容包含非法字符
- `MEDIA_001`: 文件类型不支持
- `MEDIA_002`: 文件过大
- `MEDIA_003`: 文件数量超限
- `VOTE_001`: 不能给自己的评论投票
- `VOTE_002`: 已经投票过

### 配置说明

#### 环境变量
```env
# 评论配置
MAX_CONTENT_LENGTH=2000
MIN_CONTENT_LENGTH=10
MAX_MEDIA_IMAGES=9
MAX_MEDIA_VIDEOS=3
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=52428800
MAX_VIDEO_DURATION=60

# 安全配置
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/quicktime
```

### 监控和日志

#### 日志记录
- 评论创建、更新、删除
- 媒体文件上传、删除
- 审核操作记录
- 投票和举报记录
- 异常操作记录

#### 监控指标
- 评论数量统计
- 审核通过率
- 媒体文件使用量
- 投票参与率
- 举报处理效率

### 测试策略

#### 单元测试
- 服务层业务逻辑测试
- 安全验证功能测试
- 文件上传功能测试
- 数据验证测试

#### 集成测试
- API接口测试
- 数据库操作测试
- 文件存储测试
- 权限控制测试

#### E2E测试
- 完整评论流程测试
- 媒体文件上传流程
- 审核管理流程
- 安全防护测试

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [数据库设计](../architecture/database.md)
- [API设计规范](../architecture/api-standards.md)


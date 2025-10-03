# 博客系统 API 设计文档

## 概述

本博客系统支持多项目类型，使用 Markdown 格式存储内容（支持 HTML），并包含完整的标签和分类管理系统。

## 核心特性

- ✅ 多项目类型支持
- ✅ Markdown 内容存储（支持 HTML）
- ✅ 标签系统
- ✅ 分类系统（支持多级分类）
- ✅ 多语言支持
- ✅ SEO 优化
- ✅ 阅读时间计算
- ✅ 浏览量统计
- ✅ 精选文章功能
- ✅ 排序权重

## 数据模型

### Blog（博客文章）
```typescript
{
  id: number;
  title: string;                    // 博客标题
  slug: string;                     // SEO 友好的 URL
  author: string;                   // 作者名称
  language: string;                 // 语言代码（如 'zh', 'en'）
  md: string;                       // Markdown 内容（支持 HTML）
  summary?: string;                 // 博客摘要
  cover_image?: string;             // 封面图片 URL
  reading_time: number;             // 预估阅读时间（分钟）
  seo?: object;                     // SEO 相关数据
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  view_count: number;               // 浏览量
  project_type: string;             // 项目类型
  is_featured: boolean;             // 是否精选
  sort_order: number;               // 排序权重
  created_at: Date;
  updated_at: Date;
  tags: BlogTag[];                  // 关联标签
  categories: BlogCategory[];       // 关联分类
}
```

### BlogTag（博客标签）
```typescript
{
  id: number;
  name: string;                     // 标签名称
  slug: string;                     // 标签 slug
  description?: string;             // 标签描述
  color?: string;                   // 标签颜色（十六进制）
  project_type: string;             // 所属项目类型
  is_active: boolean;               // 是否启用
  sort_order: number;               // 排序权重
  created_at: Date;
  updated_at: Date;
  blogs: Blog[];                    // 关联的博客文章
}
```

### BlogCategory（博客分类）
```typescript
{
  id: number;
  name: string;                     // 分类名称
  slug: string;                     // 分类 slug
  description?: string;             // 分类描述
  parent_id?: number;               // 父分类ID（支持多级分类）
  parent?: BlogCategory;            // 父分类
  children: BlogCategory[];         // 子分类
  project_type: string;             // 所属项目类型
  is_active: boolean;               // 是否启用
  sort_order: number;               // 排序权重
  created_at: Date;
  updated_at: Date;
  blogs: Blog[];                    // 关联的博客文章
}
```

## API 接口

### 博客文章接口

#### 1. 获取博客列表
```
GET /blog/list
```

**查询参数：**
- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 10）
- `status`: 博客状态（DRAFT, PUBLISHED, ARCHIVED）
- `project_type`: 项目类型
- `search`: 搜索关键词（标题、摘要、内容）
- `tag_ids`: 标签ID列表
- `category_ids`: 分类ID列表
- `is_featured`: 是否精选
- `language`: 语言代码
- `sort_by`: 排序字段（created_at, updated_at, view_count, reading_time, sort_order）
- `sort_order`: 排序方向（asc, desc）

**响应：**
```json
{
  "data": Blog[],
  "total": number,
  "page": number,
  "page_size": number,
  "total_pages": number
}
```

#### 2. 根据ID获取博客详情
```
GET /blog/:id
```

#### 3. 根据slug获取博客详情
```
POST /blog/slug
```

**请求体：**
```json
{
  "slug": "blog-slug",
  "project_type": "project-type",
  "language": "zh"
}
```

#### 4. 创建博客文章
```
POST /blog/create
```

**请求体：**
```json
{
  "title": "博客标题",
  "slug": "blog-slug",              // 可选，自动生成
  "author": "作者名称",              // 可选，默认 'Anbin'
  "cover_image": "封面图片URL",      // 可选
  "seo": {                          // 可选
    "title": "SEO标题",
    "description": "SEO描述",
    "keywords": ["关键词1", "关键词2"]
  },
  "md": "# Markdown内容",           // 可选
  "summary": "博客摘要",             // 可选
  "language": "zh",                 // 可选，默认 'zh'
  "project_type": "项目类型",        // 必填
  "is_featured": false,             // 可选，默认 false
  "sort_order": 0,                  // 可选，默认 0
  "tag_ids": [1, 2, 3],            // 可选，标签ID列表
  "category_ids": [1, 2]           // 可选，分类ID列表
}
```

#### 5. 更新博客文章
```
PUT /blog/update
```

**请求体：**
```json
{
  "id": 1,
  "title": "更新的标题",
  "status": "PUBLISHED",
  // ... 其他字段同创建接口
}
```

#### 6. 删除博客文章
```
DELETE /blog/delete
```

**请求体：**
```json
{
  "id": 1
}
```

#### 7. 增加浏览量
```
POST /blog/:id/view
```

### 标签管理接口

#### 1. 获取标签列表
```
GET /blog/tags/list
```

**查询参数：**
- `page`: 页码
- `page_size`: 每页数量
- `project_type`: 项目类型
- `is_active`: 是否启用
- `search`: 搜索标签名称

#### 2. 创建标签
```
POST /blog/tags/create
```

**请求体：**
```json
{
  "name": "标签名称",
  "slug": "tag-slug",               // 可选，自动生成
  "description": "标签描述",         // 可选
  "color": "#FF0000",              // 可选，标签颜色
  "project_type": "项目类型",        // 必填
  "sort_order": 0                  // 可选，默认 0
}
```

#### 3. 更新标签
```
PUT /blog/tags/update
```

#### 4. 删除标签
```
DELETE /blog/tags/delete
```

### 分类管理接口

#### 1. 获取分类列表
```
GET /blog/categories/list
```

**查询参数：**
- `page`: 页码
- `page_size`: 每页数量
- `project_type`: 项目类型
- `is_active`: 是否启用
- `parent_id`: 父分类ID
- `search`: 搜索分类名称

#### 2. 创建分类
```
POST /blog/categories/create
```

**请求体：**
```json
{
  "name": "分类名称",
  "slug": "category-slug",          // 可选，自动生成
  "description": "分类描述",         // 可选
  "parent_id": 1,                   // 可选，父分类ID
  "project_type": "项目类型",        // 必填
  "sort_order": 0                   // 可选，默认 0
}
```

#### 3. 更新分类
```
PUT /blog/categories/update
```

#### 4. 删除分类
```
DELETE /blog/categories/delete
```

## 使用示例

### 创建一篇博客文章

```bash
curl -X POST http://localhost:3000/blog/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇博客",
    "project_type": "wanflower",
    "md": "# 欢迎来到我的博客\n\n这是第一篇博客文章，支持 **Markdown** 语法。\n\n```javascript\nconsole.log(\"Hello World!\");\n```",
    "summary": "这是我的第一篇博客文章",
    "language": "zh",
    "is_featured": true,
    "tag_ids": [1, 2],
    "category_ids": [1]
  }'
```

### 获取博客列表

```bash
curl "http://localhost:3000/blog/list?project_type=wanflower&status=PUBLISHED&page=1&page_size=10"
```

### 根据slug获取博客

```bash
curl -X POST http://localhost:3000/blog/slug \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "wo-de-di-yi-pian-bo-ke",
    "project_type": "wanflower",
    "language": "zh"
  }'
```

## 注意事项

1. **项目类型隔离**：所有博客内容都通过 `project_type` 字段进行隔离，确保不同项目的数据不会混淆。

2. **Slug 唯一性**：在同一语言和项目类型下，slug 必须唯一。

3. **Markdown 支持**：支持标准 Markdown 语法，同时允许嵌入 HTML 标签。

4. **阅读时间计算**：系统会自动根据 Markdown 内容长度计算预估阅读时间。

5. **多语言支持**：支持多语言博客，通过 `language` 字段区分。

6. **SEO 优化**：提供完整的 SEO 字段支持，包括自定义标题、描述和关键词。

7. **权限控制**：所有管理接口（创建、更新、删除）需要适当的权限验证。

## 数据库迁移

在部署前，请确保运行以下命令来应用数据库变更：

```bash
npx prisma db push
npx prisma generate
```

这将创建新的表结构并生成最新的 Prisma 客户端。

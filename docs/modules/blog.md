# 博客系统模块

## 概述

博客系统模块提供完整的内容管理功能，支持多项目类型、多语言、Markdown格式内容，包含标签和分类管理系统，以及完整的SEO优化功能。

## 核心特性

### ✅ 已实现功能
- **多项目类型支持**: 不同项目的内容隔离
- **Markdown内容存储**: 支持标准Markdown和HTML
- **标签系统**: 灵活的标签管理
- **分类系统**: 支持多级分类结构
- **多语言支持**: 国际化内容管理
- **SEO优化**: 完整的SEO字段支持
- **阅读时间计算**: 自动计算预估阅读时间
- **浏览量统计**: 文章访问量统计
- **精选文章功能**: 支持文章精选
- **排序权重**: 自定义文章排序

### 🔄 计划功能
- **内容审核**: 文章发布审核流程
- **版本控制**: 文章版本历史管理
- **协作编辑**: 多人协作编辑功能
- **内容推荐**: 基于用户行为的推荐
- **评论系统**: 文章评论功能
- **内容分析**: 阅读数据分析和报表

## 技术实现

### 数据库设计

博客系统模块包含以下核心表：
- **Blog**: 博客文章，支持Markdown格式和SEO优化
- **BlogTag**: 博客标签，支持颜色和项目类型隔离
- **BlogCategory**: 博客分类，支持多级分类结构
- **BlogTagRelation**: 博客标签关联表
- **BlogCategoryRelation**: 博客分类关联表

详细表结构请参考 Prisma Schema 文件。

### API接口

博客系统模块提供以下核心接口：

#### 博客文章管理
- **GET /blog/list** - 获取博客列表（支持筛选、搜索、分页）
- **GET /blog/{id}** - 获取博客详情
- **POST /blog/slug** - 根据slug获取博客
- **POST /blog/create** - 创建博客文章
- **PUT /blog/update** - 更新博客文章
- **DELETE /blog/delete** - 删除博客文章
- **POST /blog/{id}/view** - 增加浏览量

#### 标签管理
- **GET /blog/tags/list** - 获取标签列表
- **POST /blog/tags/create** - 创建标签
- **PUT /blog/tags/update** - 更新标签
- **DELETE /blog/tags/delete** - 删除标签

#### 分类管理
- **GET /blog/categories/list** - 获取分类列表
- **POST /blog/categories/create** - 创建分类
- **PUT /blog/categories/update** - 更新分类
- **DELETE /blog/categories/delete** - 删除分类

详细的API接口文档请参考 Swagger 文档。

### 服务架构

#### 核心服务
- **BlogService**: 博客文章业务逻辑
- **BlogTagService**: 标签管理服务
- **BlogCategoryService**: 分类管理服务
- **MarkdownService**: Markdown处理服务

#### 控制器
- **BlogController**: 博客文章接口
- **BlogTagController**: 标签管理接口
- **BlogCategoryController**: 分类管理接口

### 内容处理

#### Markdown处理
```typescript
// 阅读时间计算
private calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Slug生成
private generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
```

#### SEO优化
```typescript
interface SeoDto {
  title?: string;
  description?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
}
```

### 权限控制

#### 权限级别
- **公开接口**: 文章查询、标签查询、分类查询
- **员工权限**: 文章管理、标签管理、分类管理
- **管理员权限**: 系统配置、批量操作

#### 权限装饰器
```typescript
@Roles('STAFF', 'ADMIN')  // 员工和管理员
@Roles('ADMIN')           // 仅管理员
@Public()                 // 公开接口
```

### 业务规则

#### 内容规则
1. **项目类型隔离**: 所有内容通过project_type字段隔离
2. **Slug唯一性**: 在同一语言和项目类型下，slug必须唯一
3. **Markdown支持**: 支持标准Markdown语法和HTML标签
4. **阅读时间**: 系统自动根据内容长度计算
5. **多语言**: 通过language字段区分不同语言内容

#### 标签规则
1. **名称唯一性**: 在同一项目类型下，标签名称必须唯一
2. **颜色格式**: 颜色值必须是有效的十六进制格式
3. **关联管理**: 删除标签时检查是否有关联文章

#### 分类规则
1. **层级限制**: 最多支持3级分类
2. **循环引用**: 防止分类的循环引用
3. **删除限制**: 有子分类或文章的分类不能删除

### 错误处理

#### 常见错误码
- `BLOG_001`: 博客不存在
- `BLOG_002`: Slug已存在
- `BLOG_003`: 项目类型不存在
- `TAG_001`: 标签不存在
- `TAG_002`: 标签名称已存在
- `CATEGORY_001`: 分类不存在
- `CATEGORY_002`: 分类名称已存在
- `CATEGORY_003`: 分类有子分类，不能删除

### 配置说明

#### 环境变量
```env
# 博客配置
DEFAULT_AUTHOR=Anbin
DEFAULT_LANGUAGE=zh
WORDS_PER_MINUTE=200
MAX_CATEGORY_LEVEL=3

# 内容配置
ALLOW_HTML_IN_MARKDOWN=true
MAX_CONTENT_LENGTH=100000
```

### 监控和日志

#### 日志记录
- 文章创建、更新、删除
- 标签和分类管理操作
- 浏览量统计
- 搜索查询记录

#### 监控指标
- 文章数量统计
- 浏览量统计
- 标签使用频率
- 分类分布情况
- 搜索关键词统计

### 测试策略

#### 单元测试
- 服务层业务逻辑测试
- Markdown处理功能测试
- 数据验证测试

#### 集成测试
- API接口测试
- 数据库操作测试
- 内容处理测试

#### E2E测试
- 完整博客管理流程
- 内容发布流程
- 权限控制测试

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [数据库设计](../architecture/database.md)
- [API设计规范](../architecture/api-standards.md)


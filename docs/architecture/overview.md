# 系统概览

## 项目简介

万花电商系统是一个基于现代技术栈构建的全栈电商平台，包含管理后台、用户端网站和完整的后端API服务。

## 技术架构

### 后端服务 (wanflower-server)
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + OAuth2 (Google)
- **文件存储**: 本地存储 + CDN (OSS)
- **API文档**: Swagger/OpenAPI

### 前端应用

#### 管理后台 (apps/admin)
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **UI库**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **API客户端**: backend-api 包

#### 用户端网站 (apps/wanflower.com)
- **框架**: Next.js 15 + TypeScript
- **样式**: Tailwind CSS
- **国际化**: 多语言支持
- **SEO**: 完整的SEO优化

### 共享包 (packages)
- **backend-api**: 统一的API客户端
- **react-markdown**: 自定义Markdown组件

## 核心功能模块

### 1. 认证系统
- 邮箱密码登录
- Google OAuth2 集成
- 双Token机制 (Access + Refresh)
- 设备管理和信任机制
- 邮箱验证和防暴力破解

### 2. 产品管理
- 产品CRUD操作
- 多级分类管理
- 媒体文件管理 (图片/视频)
- 库存管理
- SEO优化

### 3. 订单系统
- 完整订单流程
- 购物车管理
- 支付集成 (预留)
- 物流管理 (预留)

### 4. 用户管理
- 用户信息管理
- 权限控制 (角色系统)
- 用户活动记录
- 设备管理

### 5. 内容管理
- 博客系统 (Markdown支持)
- 评论系统
- 多语言支持
- SEO优化

## 数据库设计

### 核心表结构
- **User**: 用户基础信息
- **Product**: 产品信息
- **Order**: 订单信息
- **Blog**: 博客文章
- **Review**: 产品评论

### 安全相关表
- **EmailVerification**: 邮箱验证
- **RefreshToken**: 刷新令牌
- **UserDevice**: 用户设备
- **LoginAttempt**: 登录尝试记录

## API设计原则

### RESTful设计
- 统一的响应格式
- 标准HTTP状态码
- 合理的资源命名

### 权限控制
- 基于角色的访问控制 (RBAC)
- JWT令牌验证
- 接口级权限控制

### 文档化
- Swagger自动生成API文档
- 完整的请求/响应示例
- 错误码说明

## 安全特性

### 认证安全
- 双Token机制
- 设备指纹识别
- 登录尝试限制
- 邮箱验证机制

### 数据安全
- 密码加密存储
- SQL注入防护
- XSS防护
- CSRF防护

### 运维安全
- 详细的操作日志
- 性能监控
- 错误追踪
- 自动清理机制

## 开发规范

### 代码规范
- TypeScript严格模式
- ESLint + Prettier
- 统一的命名规范
- 完整的类型定义

### 测试规范
- 单元测试覆盖
- 集成测试
- E2E测试 (计划中)

### 文档规范
- 完整的API文档
- 代码注释
- 变更记录
- 部署指南

## 部署架构

### 开发环境
- 本地开发服务器
- 热重载支持
- 调试工具集成

### 生产环境
- Docker容器化部署
- Nginx反向代理
- 数据库集群 (计划中)
- CDN加速

## 监控和日志

### 日志系统
- 结构化日志
- 多级别日志
- 性能监控
- 错误追踪

### 监控指标
- API响应时间
- 数据库性能
- 系统资源使用
- 业务指标统计

## 扩展性设计

### 微服务架构 (计划中)
- 服务拆分
- 服务间通信
- 配置中心
- 服务发现

### 缓存策略
- Redis缓存
- 查询优化
- 静态资源缓存

### 消息队列 (计划中)
- 异步处理
- 事件驱动
- 解耦设计

---

**相关文档**:
- [数据库设计](./database.md)
- [API设计规范](./api-standards.md)
- [开发环境搭建](../development/setup.md)


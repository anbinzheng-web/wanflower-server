# 文档编写规范

## 基本原则

### 1. 专注业务逻辑和架构设计
- 文档应专注于业务逻辑、架构设计和系统设计思路
- 避免重复技术实现细节
- 重点说明"为什么"而不是"怎么做"

### 2. 避免冗余信息
- **不要写入SQL建表语句** - 交给Prisma Schema管理
- **不要写入详细的API请求/响应示例** - 交给Swagger文档管理
- **不要重复代码实现细节** - 代码本身就是最好的文档

### 3. 统一引用规范
- 数据库结构：使用"详细表结构请参考 Prisma Schema 文件"
- API接口：使用"详细的API接口文档请参考 Swagger 文档"
- 代码实现：使用"具体实现请参考源代码"

## 文档类型和内容要求

### 模块文档 (docs/modules/)
**核心内容**：
- 模块概述和核心特性
- 业务逻辑和设计思路
- 架构设计和模块关系
- 权限控制和安全机制
- 配置说明和监控指标

**避免内容**：
- 详细的SQL建表语句
- 完整的API请求/响应示例
- 具体的代码实现细节

### API文档 (docs/apis/)
**核心内容**：
- API功能概述和权限说明
- 接口分类和功能描述
- 数据模型和业务规则
- 错误处理和注意事项

**避免内容**：
- 详细的请求/响应示例（交给Swagger）
- 具体的参数验证规则（交给代码注释）

### 架构文档 (docs/architecture/)
**核心内容**：
- 系统整体架构设计
- 技术选型和设计决策
- 模块间的关系和交互
- 扩展性和性能考虑

**避免内容**：
- 具体的实现代码
- 详细的配置参数

## 文档模板使用

### 模块文档模板
使用 `docs/templates/module-template.md`，重点关注：
- 业务逻辑说明
- 架构设计思路
- 权限控制机制
- 监控和日志策略

### API文档模板
使用 `docs/templates/api-template.md`，重点关注：
- 功能概述和权限说明
- 接口分类和功能描述
- 数据模型和业务规则

## 质量检查清单

### ✅ 必须包含
- [ ] 清晰的业务逻辑说明
- [ ] 架构设计思路
- [ ] 权限控制机制
- [ ] 配置说明
- [ ] 监控和日志策略
- [ ] 统一的引用规范

### ❌ 必须避免
- [ ] SQL建表语句
- [ ] 详细的API请求/响应示例
- [ ] 具体的代码实现细节
- [ ] 重复的技术实现信息

## 维护原则

### 1. 职责明确
- **文档** → 业务逻辑和架构设计
- **Prisma Schema** → 数据库结构
- **Swagger** → API接口文档
- **代码注释** → 实现细节

### 2. 同步更新
- 业务逻辑变更时更新文档
- 架构调整时更新文档
- 避免更新技术实现细节

### 3. 版本控制
- 文档变更需要提交到版本控制
- 重要变更需要更新CHANGELOG
- 保持文档与代码的同步

## 示例对比

### ❌ 错误示例
```markdown
### 数据库设计

**User表**
```sql
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255),
  "role" "UserRole" DEFAULT 'USER',
  "created_at" TIMESTAMP DEFAULT NOW()
);
```

### API接口

**POST /auth/login**
```typescript
// 请求
{
  email: string;
  password: string;
}

// 响应
{
  access_token: string;
  user: UserDto;
}
```
```

### ✅ 正确示例
```markdown
### 数据库设计

认证系统包含以下核心表：
- **User**: 用户基础信息，支持第三方登录
- **RefreshToken**: 刷新令牌管理，支持设备绑定
- **EmailVerification**: 邮箱验证码管理

详细表结构请参考 Prisma Schema 文件。

### API接口

认证系统提供以下核心接口：
- **POST /auth/login** - 用户登录
- **POST /auth/refresh** - 刷新Token
- **POST /auth/logout** - 用户登出

详细的API接口文档请参考 Swagger 文档。
```

---

**相关文档**:
- [文档中心首页](../README.md)
- [模块文档模板](../templates/module-template.md)
- [API文档模板](../templates/api-template.md)

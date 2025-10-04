# 数据库重置指南

## 概述

本文档详细说明了万花电商系统数据库的重置流程，包括开发环境和生产环境的不同处理方式。

## 问题背景

在使用 `prisma migrate reset` 时可能遇到以下问题：
- 影子数据库权限不足
- 迁移文件缺失
- 数据库表不存在

## 解决方案

### 方法一：使用 db push（推荐用于开发环境）

当遇到权限问题或迁移文件问题时，使用 `db push` 命令：

```bash
# 直接同步数据库结构（推荐）
pnpm db:push

# 强制重置并同步（会删除所有数据）
pnpm db:push:force
```

### 方法二：使用 migrate reset（标准流程）

```bash
# 开发环境完整重置（包含种子数据）
pnpm db:reset:full

# 开发环境重置（不包含种子数据）
pnpm db:reset:dev

# 生产环境重置（不包含种子数据，更安全）
pnpm db:reset:prod
```

## 命令说明

### 数据库同步命令

| 命令 | 用途 | 适用环境 | 说明 |
|------|------|----------|------|
| `pnpm db:push` | 同步数据库结构 | 开发 | 直接推送 schema 到数据库 |
| `pnpm db:push:force` | 强制重置并同步 | 开发 | 删除所有数据后重新创建 |

### 迁移命令

| 命令 | 用途 | 适用环境 | 说明 |
|------|------|----------|------|
| `pnpm db:migrate:dev` | 开发环境迁移 | 开发 | 创建并应用迁移 |
| `pnpm db:migrate:deploy` | 生产环境迁移 | 生产 | 仅应用现有迁移 |
| `pnpm db:migrate:status` | 查看迁移状态 | 所有 | 检查迁移状态 |

### 重置命令

| 命令 | 用途 | 适用环境 | 说明 |
|------|------|----------|------|
| `pnpm db:reset:dev` | 开发环境重置 | 开发 | 重置数据库，不运行种子 |
| `pnpm db:reset:prod` | 生产环境重置 | 生产 | 重置数据库，跳过种子数据 |
| `pnpm db:reset:full` | 完整重置 | 开发 | 重置数据库并运行种子数据 |

### 种子数据命令

| 命令 | 用途 | 适用环境 | 说明 |
|------|------|----------|------|
| `pnpm prisma:seed` | 运行种子数据 | 所有 | 填充测试数据 |

### 备份恢复命令

| 命令 | 用途 | 适用环境 | 说明 |
|------|------|----------|------|
| `pnpm db:backup` | 备份数据库 | 所有 | 创建数据库备份 |
| `pnpm db:restore` | 恢复数据库 | 所有 | 从备份恢复数据库 |

## 推荐流程

### 开发环境重置

```bash
# 1. 备份当前数据（可选）
pnpm db:backup

# 2. 重置数据库并填充种子数据
pnpm db:reset:full

# 或者分步执行
pnpm db:reset:dev
pnpm prisma:seed
```

### 生产环境重置

```bash
# 1. 备份生产数据（必须）
pnpm db:backup

# 2. 重置数据库（不运行种子数据）
pnpm db:reset:prod

# 3. 手动运行种子数据（如果需要）
pnpm prisma:seed
```

### 权限问题解决

当遇到影子数据库权限问题时：

```bash
# 使用 db push 替代 migrate
pnpm db:push

# 如果需要重置数据
pnpm db:push:force
```

## 测试账号

重置完成后，系统会创建以下测试账号：

| 角色 | 邮箱 | 密码 | 状态 |
|------|------|------|------|
| 管理员 | admin@gmail.com | Qpalzm1. | 已验证 |
| 普通用户 | user@gmail.com | Qpalzm1. | 已验证 |
| 员工 | staff@gmail.com | Qpalzm1. | 已验证 |
| 未验证用户 | unverified@gmail.com | Qpalzm1. | 未验证 |
| 禁用用户 | disabled@gmail.com | Qpalzm1. | 已禁用 |

验证码：
- 邮箱验证码: `123456` (用于 unverified@gmail.com)
- 重置密码验证码: `654321` (用于 admin@gmail.com)

## 安全注意事项

### 生产环境

1. **备份优先**：重置前必须备份生产数据
2. **分步执行**：先重置，再手动决定是否运行种子数据
3. **权限检查**：确保数据库用户有足够权限
4. **环境隔离**：确保在正确的环境执行命令

### 开发环境

1. **数据安全**：开发环境可以随意重置
2. **种子数据**：建议使用完整重置流程
3. **权限问题**：使用 `db push` 命令绕过权限限制

## 故障排除

### 常见错误

1. **P3014 错误**：影子数据库权限不足
   - 解决：使用 `pnpm db:push` 替代 `prisma migrate dev`

2. **表不存在错误**：迁移文件缺失
   - 解决：使用 `pnpm db:push` 直接同步

3. **种子数据失败**：数据库表结构不完整
   - 解决：先执行 `pnpm db:push`，再运行 `pnpm prisma:seed`

### 检查步骤

```bash
# 1. 检查数据库连接
pnpm prisma db pull

# 2. 检查迁移状态
pnpm db:migrate:status

# 3. 检查 Prisma Client
pnpm prisma:generate

# 4. 测试种子数据
pnpm prisma:seed
```

## 更新日志

- 2024-01-XX: 初始版本，解决权限问题和迁移文件缺失问题
- 2024-01-XX: 添加生产环境安全考虑
- 2024-01-XX: 完善命令说明和故障排除指南


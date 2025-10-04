# 数据库命令快速参考

## 🚀 常用命令

### 开发环境重置（推荐）
```bash
# 完整重置（推荐用于开发环境）
pnpm db:reset:full

# 或者分步执行
pnpm db:push
pnpm prisma:seed
```

### 生产环境重置（谨慎）
```bash
# 1. 备份数据（必须）
pnpm db:backup

# 2. 重置数据库（不运行种子数据）
pnpm db:reset:prod

# 3. 手动运行种子数据（如果需要）
pnpm prisma:seed
```

## 📋 命令列表

| 命令 | 用途 | 环境 | 说明 |
|------|------|------|------|
| `pnpm db:push` | 同步数据库结构 | 开发 | 直接推送 schema |
| `pnpm db:push:force` | 强制重置并同步 | 开发 | 删除所有数据后重新创建 |
| `pnpm db:reset:dev` | 开发环境重置 | 开发 | 重置数据库，不运行种子 |
| `pnpm db:reset:prod` | 生产环境重置 | 生产 | 重置数据库，跳过种子数据 |
| `pnpm db:reset:full` | 完整重置 | 开发 | 重置数据库并运行种子数据 |
| `pnpm prisma:seed` | 运行种子数据 | 所有 | 填充测试数据 |
| `pnpm db:backup` | 备份数据库 | 所有 | 创建数据库备份 |
| `pnpm db:migrate:status` | 查看迁移状态 | 所有 | 检查迁移状态 |

## ⚠️ 重要提醒

### 开发环境
- 可以随意重置，数据会丢失
- 推荐使用 `pnpm db:reset:full`
- 遇到权限问题使用 `pnpm db:push`

### 生产环境
- **必须先备份**：`pnpm db:backup`
- 使用 `pnpm db:reset:prod`（不运行种子数据）
- 谨慎操作，数据不可恢复

## 🔧 故障排除

### 权限问题
```bash
# 使用 db push 替代 migrate
pnpm db:push
```

### 表不存在
```bash
# 先同步结构，再运行种子
pnpm db:push
pnpm prisma:seed
```

### 迁移失败
```bash
# 检查状态
pnpm db:migrate:status

# 强制推送
pnpm db:push:force
```

## 📞 测试账号

重置完成后可使用以下账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@gmail.com | Qpalzm1. |
| 普通用户 | user@gmail.com | Qpalzm1. |
| 员工 | staff@gmail.com | Qpalzm1. |
| 未验证用户 | unverified@gmail.com | Qpalzm1. |
| 禁用用户 | disabled@gmail.com | Qpalzm1. |

验证码：
- 邮箱验证码: `123456`
- 重置密码验证码: `654321`


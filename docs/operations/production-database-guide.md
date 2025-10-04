# 生产环境数据库管理指南

## 概述

本文档专门针对生产环境的数据库管理，提供安全、可靠的数据库操作流程。

## 生产环境安全原则

### 1. 数据安全第一
- 任何操作前必须备份
- 使用只读权限检查数据
- 分步执行，每步验证

### 2. 权限最小化
- 生产环境使用专用数据库用户
- 限制不必要的权限
- 定期审计权限使用

### 3. 操作可追溯
- 记录所有数据库操作
- 使用版本控制管理迁移
- 保留操作日志

## 生产环境命令

### 安全的重置流程

```bash
# 1. 创建完整备份（必须）
pnpm db:backup

# 2. 验证备份文件
ls -la backup_*.sql

# 3. 检查当前迁移状态
pnpm db:migrate:status

# 4. 应用新迁移（如果有）
pnpm db:migrate:deploy

# 5. 重置数据库（谨慎操作）
pnpm db:reset:prod

# 6. 验证数据库状态
pnpm db:migrate:status
```

### 紧急恢复流程

```bash
# 1. 停止应用服务
# systemctl stop your-app-service

# 2. 恢复最新备份
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 3. 验证数据完整性
pnpm db:migrate:status

# 4. 重启应用服务
# systemctl start your-app-service
```

## 环境变量配置

### 生产环境 .env 示例

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/wanflower_prod?schema=public"

# 应用配置
NODE_ENV=production
PORT=3000

# 安全配置
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/wanflower/app.log
```

### 数据库用户权限

```sql
-- 创建生产环境专用用户
CREATE USER wanflower_prod WITH PASSWORD 'secure_password';

-- 授予必要权限
GRANT CONNECT ON DATABASE wanflower TO wanflower_prod;
GRANT USAGE ON SCHEMA public TO wanflower_prod;
GRANT CREATE ON SCHEMA public TO wanflower_prod;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wanflower_prod;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wanflower_prod;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wanflower_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wanflower_prod;
```

## 监控和告警

### 数据库监控指标

1. **连接数监控**
   ```bash
   # 检查当前连接数
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **磁盘空间监控**
   ```bash
   # 检查数据库大小
   psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('wanflower'));"
   ```

3. **慢查询监控**
   ```bash
   # 启用慢查询日志
   # 在 postgresql.conf 中设置：
   # log_min_duration_statement = 1000  # 记录超过1秒的查询
   ```

### 自动备份脚本

创建 `/scripts/backup.sh`：

```bash
#!/bin/bash
# 数据库自动备份脚本

set -e

# 配置
DB_URL="${DATABASE_URL}"
BACKUP_DIR="/var/backups/wanflower"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
BACKUP_FILE="$BACKUP_DIR/wanflower_$(date +%Y%m%d_%H%M%S).sql"

# 执行备份
echo "开始备份数据库..."
pg_dump "$DB_URL" > "$BACKUP_FILE"

# 压缩备份文件
gzip "$BACKUP_FILE"

# 清理旧备份
find "$BACKUP_DIR" -name "wanflower_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成: ${BACKUP_FILE}.gz"
```

### 定时任务配置

```bash
# 添加到 crontab
# 每天凌晨2点执行备份
0 2 * * * /scripts/backup.sh >> /var/log/wanflower/backup.log 2>&1
```

## 部署流程

### 1. 预部署检查

```bash
# 检查迁移状态
pnpm db:migrate:status

# 检查数据库连接
pnpm prisma db pull

# 验证环境变量
echo $DATABASE_URL
```

### 2. 部署步骤

```bash
# 1. 备份当前数据
pnpm db:backup

# 2. 应用数据库迁移
pnpm db:migrate:deploy

# 3. 重启应用服务
# systemctl restart your-app-service

# 4. 验证服务状态
# systemctl status your-app-service
```

### 3. 回滚流程

```bash
# 1. 停止应用服务
# systemctl stop your-app-service

# 2. 恢复备份
psql $DATABASE_URL < backup_file.sql

# 3. 重启应用服务
# systemctl start your-app-service
```

## 安全检查清单

### 部署前检查

- [ ] 数据库备份已创建
- [ ] 迁移文件已测试
- [ ] 环境变量已配置
- [ ] 权限设置正确
- [ ] 监控已配置

### 部署后检查

- [ ] 应用服务正常运行
- [ ] 数据库连接正常
- [ ] 关键功能测试通过
- [ ] 日志无错误信息
- [ ] 性能指标正常

## 故障处理

### 常见问题

1. **迁移失败**
   ```bash
   # 检查迁移状态
   pnpm db:migrate:status
   
   # 手动修复迁移
   # 编辑迁移文件或回滚到上一个版本
   ```

2. **数据不一致**
   ```bash
   # 比较 schema 和数据库
   pnpm prisma db pull
   
   # 生成差异报告
   pnpm prisma migrate diff
   ```

3. **性能问题**
   ```bash
   # 分析慢查询
   psql $DATABASE_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

### 紧急联系

- 数据库管理员：[联系方式]
- 系统管理员：[联系方式]
- 开发团队：[联系方式]

## 更新日志

- 2024-01-XX: 初始版本，建立生产环境安全规范
- 2024-01-XX: 添加监控和告警配置
- 2024-01-XX: 完善故障处理流程

---

**相关文档**:
- [数据库管理](./database-management.md)
- [部署指南](../development/deployment.md)
- [监控和日志](./logging-system.md)


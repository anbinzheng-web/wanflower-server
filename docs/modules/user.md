# 用户管理模块

## 概述

用户管理模块提供完整的用户生命周期管理功能，包括用户信息管理、权限控制、活动记录、设备管理等功能，为管理后台提供强大的用户管理能力。

## 核心特性

### ✅ 已实现功能
- **用户CRUD操作**: 完整的增删改查功能
- **权限控制**: 基于角色的访问控制 (USER/STAFF/ADMIN)
- **用户状态管理**: 激活/禁用、邮箱验证
- **角色管理**: 用户角色分配和权限控制
- **密码管理**: 密码重置和安全验证
- **活动记录**: 用户操作日志和登录记录
- **设备管理**: 设备指纹识别和信任机制
- **统计监控**: 用户数据统计和分析

### 🔄 计划功能
- **批量操作**: 批量用户管理功能
- **用户导入导出**: Excel/CSV导入导出
- **高级搜索**: 多条件组合搜索
- **用户分组**: 用户分组管理
- **权限模板**: 预定义权限模板

## 技术实现

### 数据库设计

用户管理模块包含以下核心表：
- **User**: 用户基础信息，包含角色、状态、登录统计等
- **UserAddress**: 用户地址管理，支持多地址和默认地址
- **UserDevice**: 用户设备管理，支持设备信任机制
- **UserActivity**: 用户活动记录，用于审计和监控

详细表结构请参考 Prisma Schema 文件。

### API接口

用户管理模块提供以下核心接口：

#### 用户管理
- **GET /admin/users** - 获取用户列表（支持筛选、搜索、分页）
- **GET /admin/users/{id}** - 获取用户详情
- **POST /admin/users** - 创建用户
- **PUT /admin/users/{id}** - 更新用户信息
- **DELETE /admin/users/{id}** - 删除用户

#### 用户状态管理
- **PUT /admin/users/{id}/status** - 更新用户状态
- **PUT /admin/users/{id}/role** - 更新用户角色
- **PUT /admin/users/{id}/password** - 重置用户密码
- **PUT /admin/users/{id}/verify-email** - 验证用户邮箱

#### 统计和监控
- **GET /admin/users/stats/overview** - 获取用户统计信息
- **GET /admin/users/{id}/activities** - 获取用户活动记录
- **GET /admin/users/{id}/devices** - 获取用户设备列表
- **PUT /admin/users/{id}/devices/{deviceId}/trust** - 更新设备信任状态

详细的API接口文档请参考 Swagger 文档。

### 服务架构

#### 核心服务
- **UserService**: 用户业务逻辑
- **UserActivityService**: 用户活动记录
- **UserDeviceService**: 设备管理
- **UserAddressService**: 地址管理

#### 控制器
- **UserController**: 基础用户接口
- **UserManagementController**: 用户管理接口
- **UserActivityController**: 用户活动接口

### 权限控制

#### 角色定义
```typescript
enum UserRole {
  USER = 'USER',           // 普通用户
  STAFF = 'STAFF',         // 员工
  ADMIN = 'ADMIN'          // 管理员
}
```

#### 权限级别
- **公开接口**: 用户注册、登录、个人信息
- **用户权限**: 个人资料管理、地址管理
- **员工权限**: 用户查询、活动查看
- **管理员权限**: 所有用户管理操作

#### 权限装饰器
```typescript
@Roles('ADMIN')           // 仅管理员
@Roles('STAFF', 'ADMIN')  // 员工和管理员
@Public()                 // 公开接口
```

### 安全特性

#### 认证安全
- JWT双Token机制
- 设备指纹识别
- 登录尝试限制
- 邮箱验证机制

#### 数据安全
- 密码bcrypt加密存储
- 敏感信息脱敏
- 操作日志记录
- 权限验证

#### 业务安全
- 级联删除保护
- 角色变更审计
- 敏感操作确认
- 异常行为检测

### 业务规则

#### 用户创建规则
1. 邮箱必须唯一
2. 密码强度验证
3. 角色权限验证
4. 必填字段验证

#### 用户更新规则
1. 邮箱唯一性检查
2. 角色变更审计
3. 状态变更记录
4. 敏感操作确认

#### 用户删除规则
1. 级联删除相关数据
2. 软删除保护
3. 删除确认机制
4. 审计日志记录

### 错误处理

#### 常见错误码
- `USER_001`: 用户不存在
- `USER_002`: 邮箱已存在
- `USER_003`: 权限不足
- `USER_004`: 密码强度不够
- `USER_005`: 用户已被禁用
- `USER_006`: 邮箱未验证
- `USER_007`: 设备不存在
- `USER_008`: 活动记录不存在

### 配置说明

#### 环境变量
```env
# 用户管理配置
DEFAULT_USER_ROLE=USER
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_SPECIAL_CHARS=true
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=15

# 设备管理配置
DEVICE_TRUST_DURATION=30
MAX_DEVICES_PER_USER=10
```

### 监控和日志

#### 日志记录
- 用户创建、更新、删除
- 角色和状态变更
- 密码重置操作
- 设备管理操作
- 异常登录行为

#### 监控指标
- 用户总数和活跃数
- 角色分布统计
- 登录成功率
- 设备信任率
- 异常行为次数

### 测试策略

#### 单元测试
- 服务层业务逻辑测试
- 权限控制测试
- 数据验证测试
- 安全功能测试

#### 集成测试
- API接口测试
- 数据库操作测试
- 权限验证测试
- 级联删除测试

#### E2E测试
- 完整用户管理流程
- 权限控制测试
- 安全功能测试
- 性能压力测试

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [数据库设计](../architecture/database.md)
- [认证系统模块](./auth.md)


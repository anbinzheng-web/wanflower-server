# 用户管理API文档

## 概述

用户管理API为管理后台提供完整的用户增删查改功能，支持分页、筛选、搜索等高级功能。所有接口都需要管理员或员工权限。

## 基础信息

- **基础路径**: `/admin/users`
- **认证方式**: Bearer Token (JWT)
- **权限要求**: 管理员(admin) 或 员工(staff)

## API接口列表

### 1. 获取用户列表

**接口**: `GET /admin/users`

**描述**: 获取用户列表，支持分页、筛选、搜索功能

**权限**: admin, staff

**查询参数**:
```typescript
{
  page?: number;           // 页码，默认1
  limit?: number;          // 每页数量，默认10，最大100
  search?: string;         // 搜索关键词（邮箱、姓名）
  role?: string;           // 角色筛选：user, staff, admin
  is_verified?: boolean;   // 验证状态筛选
  is_active?: boolean;     // 激活状态筛选
  sortBy?: string;         // 排序字段，默认created_at
  sortOrder?: 'asc' | 'desc'; // 排序方向，默认desc
}
```

**响应示例**:
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@gmail.com",
      "role": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "phone": "+1234567890",
      "avatar_url": "https://example.com/avatar.jpg",
      "is_verified": true,
      "is_active": true,
      "login_count": 5,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### 2. 获取用户详情

**接口**: `GET /admin/users/:id`

**描述**: 根据用户ID获取用户详细信息

**权限**: admin, staff

**路径参数**:
- `id`: 用户ID (number)

**响应示例**:
```json
{
  "id": 1,
  "email": "admin@gmail.com",
  "role": "admin",
  "first_name": "Admin",
  "last_name": "User",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "birth_date": "1990-01-01T00:00:00Z",
  "gender": "MALE",
  "is_verified": true,
  "is_active": true,
  "login_count": 5,
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "addresses": [
    {
      "id": 1,
      "name": "Admin User",
      "phone": "+1234567890",
      "country": "US",
      "province": "CA",
      "city": "San Francisco",
      "district": "Downtown",
      "address_line": "123 Main St",
      "postal_code": "94102",
      "is_default": true
    }
  ]
}
```

### 3. 创建用户

**接口**: `POST /admin/users`

**描述**: 创建新用户（仅管理员）

**权限**: admin

**请求体**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_verified": false,
  "is_active": true
}
```

**响应示例**:
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "role": "user",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_verified": false,
  "is_active": true,
  "login_count": 0,
  "last_login": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 4. 更新用户信息

**接口**: `PUT /admin/users/:id`

**描述**: 更新用户信息（仅管理员）

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**请求体**:
```json
{
  "email": "updated@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_verified": true,
  "is_active": true
}
```

**响应示例**:
```json
{
  "id": 1,
  "email": "updated@example.com",
  "role": "admin",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_verified": true,
  "is_active": true,
  "login_count": 5,
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 5. 删除用户

**接口**: `DELETE /admin/users/:id`

**描述**: 删除用户（仅管理员）

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**响应**: 204 No Content

### 6. 更新用户状态

**接口**: `PUT /admin/users/:id/status`

**描述**: 激活或禁用用户账户

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**请求体**:
```json
{
  "is_active": true
}
```

**响应示例**:
```json
{
  "message": "用户已激活",
  "user": {
    "id": 1,
    "email": "admin@gmail.com",
    "role": "admin",
    "is_active": true
  }
}
```

### 7. 更新用户角色

**接口**: `PUT /admin/users/:id/role`

**描述**: 修改用户角色权限

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**请求体**:
```json
{
  "role": "staff"
}
```

**响应示例**:
```json
{
  "message": "用户角色已更新为staff",
  "user": {
    "id": 1,
    "email": "admin@gmail.com",
    "role": "staff"
  }
}
```

### 8. 重置用户密码

**接口**: `PUT /admin/users/:id/password`

**描述**: 管理员重置用户密码

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**请求体**:
```json
{
  "password": "newpassword123"
}
```

**响应示例**:
```json
{
  "message": "用户密码已重置",
  "user": {
    "id": 1,
    "email": "admin@gmail.com",
    "role": "admin"
  }
}
```

### 9. 验证用户邮箱

**接口**: `PUT /admin/users/:id/verify-email`

**描述**: 管理员手动验证用户邮箱

**权限**: admin

**路径参数**:
- `id`: 用户ID (number)

**响应示例**:
```json
{
  "message": "用户邮箱已验证"
}
```

### 10. 获取用户统计信息

**接口**: `GET /admin/users/stats/overview`

**描述**: 获取用户总数、角色分布等统计信息

**权限**: admin, staff

**响应示例**:
```json
{
  "totalUsers": 100,
  "activeUsers": 85,
  "verifiedUsers": 90,
  "roleDistribution": [
    { "role": "user", "count": 80 },
    { "role": "staff", "count": 15 },
    { "role": "admin", "count": 5 }
  ],
  "recentRegistrations": 12
}
```

## 错误响应

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权，需要登录
- `403 Forbidden`: 权限不足
- `404 Not Found`: 用户不存在
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式

```json
{
  "statusCode": 400,
  "message": "请求参数错误",
  "error": "Bad Request"
}
```

## 使用示例

### 获取用户列表（带筛选）

```bash
curl -X GET "http://localhost:3000/admin/users?page=1&limit=10&role=user&is_active=true&search=admin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 创建用户

```bash
curl -X POST "http://localhost:3000/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "role": "user",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 更新用户状态

```bash
curl -X PUT "http://localhost:3000/admin/users/1/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

## 权限说明

- **管理员(admin)**: 拥有所有用户管理权限
- **员工(staff)**: 只能查看用户列表和详情，不能修改用户信息

## 注意事项

1. 所有接口都需要JWT认证
2. 删除用户会级联删除相关数据（地址、订单等）
3. 重置密码会记录安全日志
4. 用户状态变更会记录业务日志
5. 邮箱验证后用户才能正常登录
6. 分页查询最大限制为100条记录

## 日志记录

所有用户管理操作都会记录详细的日志：

- **业务日志**: 用户创建、更新、删除等操作
- **安全日志**: 密码重置、角色变更等敏感操作
- **操作日志**: 所有API调用和参数

这些日志可以用于审计和问题排查。

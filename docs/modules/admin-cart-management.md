# 管理员购物车管理模块

## 概述

管理员购物车管理模块提供了完整的购物车管理功能，允许管理员查看、管理和分析系统中所有用户的购物车数据。

## 功能特性

### 1. 购物车列表管理
- 分页查询所有用户的购物车
- 支持多维度筛选（用户、商品、时间等）
- 实时统计购物车信息（商品数量、总价值等）

### 2. 用户购物车管理
- 查看指定用户的购物车详情
- 删除指定用户的购物车
- 批量操作购物车项

### 3. 统计分析
- 购物车总体统计信息
- 活跃购物车数量
- 平均购物车价值
- 商品数量分布

### 4. 批量操作
- 批量删除购物车项
- 批量更新商品数量
- 清空所有购物车

## API 接口

### 基础路径
```
/admin/cart
```

### 接口列表

#### 1. 获取购物车列表
```http
GET /admin/cart
```

**查询参数：**
- `user_id` (可选): 用户ID
- `user_email` (可选): 用户邮箱（模糊搜索）
- `product_id` (可选): 商品ID
- `product_name` (可选): 商品名称（模糊搜索）
- `min_quantity` (可选): 最小数量
- `max_quantity` (可选): 最大数量
- `created_at_start` (可选): 创建时间开始
- `created_at_end` (可选): 创建时间结束
- `updated_at_start` (可选): 更新时间开始
- `updated_at_end` (可选): 更新时间结束
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认10
- `sort_by` (可选): 排序字段，默认created_at
- `sort_order` (可选): 排序方向，默认desc

**响应：**
```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": 1,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-01T10:00:00Z",
        "user": {
          "id": 1,
          "email": "user@example.com",
          "first_name": "张",
          "last_name": "三"
        },
        "items": [
          {
            "id": 1,
            "product_id": 1,
            "quantity": 2,
            "product": {
              "id": 1,
              "name": "商品名称",
              "price": 100.00,
              "original_price": 120.00,
              "stock": 50,
              "status": "ACTIVE",
              "media": [...]
            }
          }
        ],
        "statistics": {
          "total_items": 1,
          "total_quantity": 2,
          "total_value": 200.00
        }
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 10
  },
  "message": "success"
}
```

#### 2. 获取购物车统计信息
```http
GET /admin/cart/statistics
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "total_carts": 100,
    "total_cart_items": 500,
    "active_carts": 80,
    "total_value": 50000.00,
    "average_cart_value": 500.00,
    "max_items_in_cart": 15,
    "generated_at": "2024-01-01T10:00:00Z"
  },
  "message": "success"
}
```

#### 3. 获取指定用户的购物车
```http
GET /admin/cart/user/{userId}
```

**路径参数：**
- `userId`: 用户ID

#### 4. 删除指定用户的购物车
```http
DELETE /admin/cart/user/{userId}
```

**路径参数：**
- `userId`: 用户ID

#### 5. 批量操作购物车项
```http
POST /admin/cart/batch-operation
```

**请求体：**
```json
{
  "operation": "delete", // 或 "update_quantity"
  "cart_item_ids": [1, 2, 3],
  "new_quantity": 5 // 仅update_quantity操作需要
}
```

#### 6. 清空所有购物车
```http
DELETE /admin/cart/clear-all
```

## 权限要求

所有接口都需要管理员或员工权限：
- `Role.Admin`: 完全访问权限
- `Role.Staff`: 员工权限

## 使用场景

### 1. 购物车监控
管理员可以实时监控用户的购物车状态，了解用户的购买意向。

### 2. 数据清理
定期清理无效或过期的购物车数据，保持系统性能。

### 3. 用户支持
客服人员可以查看和修改用户的购物车，提供更好的客户服务。

### 4. 数据分析
通过统计信息了解用户的购物行为，优化商品推荐和营销策略。

## 注意事项

1. **权限控制**: 所有接口都需要管理员或员工权限
2. **数据安全**: 批量操作需要谨慎使用，建议先备份数据
3. **性能考虑**: 大量数据查询时建议使用分页和筛选条件
4. **日志记录**: 所有管理操作都会记录在系统日志中

## 相关模块

- [用户管理模块](../user-management.md)
- [商品管理模块](../product-management.md)
- [订单管理模块](../order-management.md)

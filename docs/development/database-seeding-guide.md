# 数据库种子数据生成指南

## 概述

本指南说明如何在不同的环境中使用数据库种子数据生成脚本，包括生产环境和开发/测试环境的配置。

## 环境区分

### 生产环境 (NODE_ENV=production)

在生产环境中，种子脚本只会创建必要的基础数据：

- **管理员账号**: `admin@wanflower.com`
- **默认密码**: `Qpalzm1.`
- **角色**: `admin`
- **状态**: 已验证、已激活

⚠️ **重要提醒**: 生产环境部署后，请立即修改默认密码！

### 开发/测试环境 (NODE_ENV=development 或其他)

在开发/测试环境中，种子脚本会创建完整的测试数据：

#### 用户账号
- **管理员**: `admin@gmail.com` (admin)
- **员工**: `staff@gmail.com` (staff)  
- **普通用户**: `user@gmail.com` (user)
- **未验证用户**: `unverified@gmail.com` (user, 未验证)
- **禁用用户**: `disabled@gmail.com` (user, 已禁用)

#### 产品数据
- **产品分类**: 电子产品、服装配饰、家居园艺
- **子分类**: 智能手机、笔记本电脑
- **测试产品**: 
  - iPhone 15 128GB (电子产品/智能手机)
  - MacBook Air M2 13英寸 (电子产品/笔记本电脑)
  - 纯棉T恤 男款 M码 (服装配饰)

#### 博客数据
- **标签**: 技术、商业
- **分类**: 新闻资讯
- **文章**: 欢迎来到万花电商平台

#### 订单数据
- **购物车**: 包含测试商品
- **订单**: 完整的订单流程数据
- **订单项**: 商品快照信息

#### 评论数据
- **产品评论**: 用户对产品的评价
- **评论状态**: 已审核通过

## 使用方法

### 1. 设置环境变量

```bash
# 生产环境
export NODE_ENV=production

# 开发环境
export NODE_ENV=development

# 测试环境（默认）
# 不设置 NODE_ENV 或设置为其他值
```

### 2. 运行种子脚本

```bash
# 使用 Prisma 运行种子脚本
npx prisma db seed

# 或者直接运行 TypeScript 文件
npx ts-node prisma/seed.ts
```

### 3. 验证数据

运行完成后，检查控制台输出确认数据创建成功：

#### 生产环境输出示例
```
🌱 开始数据库种子数据生成...
📊 当前环境: 生产环境
🏭 创建生产环境基础数据...
✅ 生产环境管理员账号创建完成: { email: 'admin@wanflower.com', role: 'admin', verified: true }
📋 生产环境账号信息:
管理员账号: admin@wanflower.com
密码: Qpalzm1.
⚠️  请在生产环境中及时修改默认密码！
```

#### 开发环境输出示例
```
🌱 开始数据库种子数据生成...
📊 当前环境: 开发环境
🧪 创建开发环境测试数据...
👥 创建测试用户...
📂 创建产品分类...
📱 创建测试产品...
📝 创建博客数据...
🛒 创建订单数据...
💬 创建评论数据...
✅ 开发环境测试数据创建完成

📋 测试账号信息:
所有账号密码: Qpalzm1.
验证码: 123456 (unverified@gmail.com)
重置密码验证码: 654321 (admin@gmail.com)

👥 用户账号:
• 管理员: admin@gmail.com (admin)
• 员工: staff@gmail.com (staff)
• 普通用户: user@gmail.com (user)
• 未验证用户: unverified@gmail.com (user, 未验证)
• 禁用用户: disabled@gmail.com (user, 已禁用)

📦 测试数据:
• 产品分类: 电子产品、服装配饰、家居园艺
• 测试产品: iPhone 15、MacBook Air、纯棉T恤
• 博客文章: 欢迎文章
• 订单数据: 包含购物车和订单
• 评论数据: 产品评论
```

## 安全注意事项

### 生产环境
1. **立即修改默认密码**: 部署后第一时间修改管理员密码
2. **使用强密码**: 密码应包含大小写字母、数字和特殊字符
3. **定期更换密码**: 建议定期更换管理员密码
4. **限制访问**: 确保只有授权人员能访问管理员账号

### 开发环境
1. **测试数据隔离**: 确保测试数据不会影响生产环境
2. **敏感信息保护**: 测试数据中不包含真实的敏感信息
3. **定期清理**: 定期清理过期的测试数据

## 自定义配置

### 修改默认密码

在 `prisma/seed.ts` 文件中修改密码：

```typescript
// 修改这行代码
const password = await global.$hashPassword('YourNewPassword');
```

### 添加新的测试数据

在相应的创建函数中添加新的测试数据：

```typescript
// 在 createTestProducts 函数中添加新产品
const newProduct = await prisma.product.upsert({
  where: { sku: 'NEW-PRODUCT-SKU' },
  update: {},
  create: {
    // 产品数据
  },
});
```

### 修改环境检测逻辑

如果需要自定义环境检测逻辑，修改 `main` 函数：

```typescript
async function main() {
  // 自定义环境检测逻辑
  const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'prod';
  
  if (isProduction) {
    await seedProductionData(password);
  } else {
    await seedDevelopmentData(password);
  }
}
```

## 故障排除

### 常见问题

1. **密码哈希错误**
   - 确保 `globalProperties.ts` 已正确注册
   - 检查 `$hashPassword` 函数是否可用

2. **数据库连接失败**
   - 检查 `DATABASE_URL` 环境变量
   - 确保数据库服务正在运行

3. **外键约束错误**
   - 确保相关表的数据已创建
   - 检查关联关系是否正确

4. **重复数据错误**
   - 使用 `upsert` 操作避免重复创建
   - 检查唯一约束字段

### 调试技巧

1. **启用详细日志**
   ```typescript
   // 在函数开始处添加
   console.log('开始创建数据...', { data });
   ```

2. **分步执行**
   ```typescript
   // 注释掉其他函数调用，只执行一个
   await createTestUsers(password);
   // await createProductCategories();
   ```

3. **检查数据库状态**
   ```sql
   -- 检查用户表
   SELECT * FROM "User" WHERE email = 'admin@gmail.com';
   
   -- 检查产品表
   SELECT * FROM "Product" WHERE sku = 'IPHONE-15-128GB';
   ```

## 最佳实践

1. **幂等性**: 种子脚本应该可以多次运行而不产生副作用
2. **数据完整性**: 确保创建的数据符合业务规则和约束
3. **性能优化**: 使用批量操作减少数据库查询次数
4. **错误处理**: 添加适当的错误处理和回滚机制
5. **文档更新**: 数据变更时及时更新相关文档

## 相关文件

- `prisma/seed.ts` - 种子数据脚本
- `prisma/schema.prisma` - 数据库模式定义
- `src/globalProperties.ts` - 全局属性注册
- `docs/architecture/database.md` - 数据库架构文档

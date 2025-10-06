# 订单支付超时功能

## 功能概述

为了优化用户体验和库存管理，系统实现了订单支付超时自动取消功能。用户下单后需要在30分钟内完成支付，超时未支付的订单将自动取消并释放库存。

## 核心特性

### 1. 支付时间限制
- **超时时间**: 30分钟
- **计算方式**: 订单创建时间 + 30分钟
- **存储字段**: `payment_deadline` (DateTime)

### 2. 自动状态流转
- **检查频率**: 每分钟检查一次
- **处理逻辑**: 自动取消超时订单并释放库存
- **状态更新**: 订单状态 → `CANCELLED`，支付状态 → `CANCELLED`

### 3. 库存管理
- **自动释放**: 超时订单取消时自动恢复商品库存
- **事务安全**: 使用数据库事务确保数据一致性

## 技术实现

### 数据库变更

#### Order表新增字段
```sql
ALTER TABLE "Order" ADD COLUMN "payment_deadline" TIMESTAMP(3);
```

#### 字段说明
- **payment_deadline**: 支付截止时间（可为空）
- **类型**: DateTime
- **用途**: 记录订单支付截止时间

### 服务层实现

#### 1. 订单创建时设置超时时间
```typescript
// 计算支付截止时间（30分钟后）
const payment_deadline = new Date(Date.now() + 30 * 60 * 1000);

// 创建订单时包含支付截止时间
const order = await this.prisma.order.create({
  data: {
    // ... 其他字段
    payment_deadline,
  }
});
```

#### 2. 定时任务处理超时订单
```typescript
@Cron(CronExpression.EVERY_MINUTE)
async handleOrderTimeout() {
  // 查找超时订单
  const expiredOrders = await this.prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      payment_deadline: { lt: new Date() }
    }
  });

  // 处理每个超时订单
  for (const order of expiredOrders) {
    await this.cancelExpiredOrder(order);
  }
}
```

#### 3. 超时订单处理逻辑
```typescript
private async cancelExpiredOrder(order: any) {
  const transaction = await this.prisma.$transaction(async (tx) => {
    // 恢复商品库存
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: { increment: item.quantity } }
      });
    }

    // 更新订单状态
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        payment_status: PaymentStatus.CANCELLED,
        admin_notes: `[${new Date().toISOString()}] 系统自动取消：订单超时未支付`
      }
    });
  });
}
```

## API接口

### 1. 获取订单支付状态
- **路径**: `GET /orders/scheduler/payment-status/:id`
- **权限**: 需要登录
- **功能**: 获取订单支付状态和剩余时间信息

#### 响应示例
```json
{
  "order_id": 123,
  "order_number": "ORD202410061234567",
  "status": "PENDING",
  "payment_status": "PENDING",
  "payment_deadline": "2024-10-06T20:00:00.000Z",
  "is_expired": false,
  "remaining_seconds": 1200,
  "remaining_minutes": 20,
  "remaining_hours": 0
}
```

### 2. 手动触发超时检查
- **路径**: `POST /orders/scheduler/check-timeout`
- **权限**: 管理员/员工
- **功能**: 手动触发超时订单检查（用于测试）

## 配置说明

### 环境变量
无需额外配置，使用默认的30分钟超时时间。

### 定时任务配置
- **检查频率**: 每分钟执行一次
- **执行时间**: 服务器启动后自动开始
- **错误处理**: 包含完整的错误日志记录

## 监控和日志

### 日志记录
- **检查日志**: 记录每次检查的超时订单数量
- **处理日志**: 记录每个订单的处理结果
- **错误日志**: 记录处理过程中的异常

### 监控指标
- **超时订单数量**: 每分钟检查到的超时订单数
- **处理成功率**: 成功处理的订单比例
- **平均处理时间**: 处理单个订单的平均耗时

## 测试验证

### 单元测试
```typescript
// 测试订单创建时设置超时时间
test('should set payment deadline when creating order', async () => {
  const order = await orderService.createOrder(userId, createOrderDto);
  expect(order.payment_deadline).toBeDefined();
  expect(order.payment_deadline.getTime()).toBeGreaterThan(Date.now());
});

// 测试超时订单处理
test('should cancel expired orders and restore stock', async () => {
  await schedulerService.handleOrderTimeout();
  // 验证订单状态和库存恢复
});
```

### 集成测试
使用测试脚本验证完整流程：
```bash
npx ts-node scripts/test-order-timeout.ts
```

## 注意事项

### 1. 时区处理
- 所有时间计算基于服务器本地时间
- 建议在生产环境中统一使用UTC时间

### 2. 性能考虑
- 定时任务每分钟执行，对数据库有一定压力
- 建议在低峰期执行，或使用队列处理

### 3. 数据一致性
- 使用数据库事务确保库存和订单状态的一致性
- 避免并发操作导致的数据不一致

### 4. 用户体验
- 前端应显示支付倒计时
- 超时前应提醒用户及时支付
- 订单取消后应通知用户

## 扩展功能

### 1. 可配置超时时间
- 支持不同商品设置不同的超时时间
- 支持节假日延长超时时间

### 2. 用户通知
- 超时前15分钟发送提醒
- 订单取消后发送通知

### 3. 统计分析
- 超时订单统计报表
- 用户支付行为分析

## 故障排查

### 常见问题

1. **定时任务未执行**
   - 检查服务器是否正常运行
   - 查看应用日志中的错误信息

2. **订单未自动取消**
   - 检查订单的payment_deadline字段是否正确设置
   - 验证定时任务的执行日志

3. **库存未正确恢复**
   - 检查商品ID是否正确
   - 验证数据库事务是否正常提交

### 调试命令
```bash
# 手动触发超时检查
curl -X POST http://localhost:3000/orders/scheduler/check-timeout \
  -H "Authorization: Bearer <token>"

# 查看订单支付状态
curl http://localhost:3000/orders/scheduler/payment-status/123 \
  -H "Authorization: Bearer <token>"
```

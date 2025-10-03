# 万花电商系统业务场景详解

## 1. Product 字段设计详解

### `dimensions` vs `attributes` 字段对比

#### `dimensions` 字段 (Json类型)
**用途：物流和空间计算**

```json
{
  "length": 25.5,
  "width": 15.0, 
  "height": 8.0,
  "unit": "cm",
  "weight": 0.5
}
```

**业务场景：**
1. **快递费用计算**
   ```typescript
   // 根据体积重量计算运费
   const volumeWeight = (length * width * height) / 5000;
   const shippingCost = Math.max(actualWeight, volumeWeight) * ratePerKg;
   ```

2. **包装盒选择**
   ```typescript
   // 自动选择合适的包装盒
   const suitableBox = boxes.find(box => 
     box.length >= product.dimensions.length &&
     box.width >= product.dimensions.width &&
     box.height >= product.dimensions.height
   );
   ```

3. **用户空间确认**
   ```typescript
   // 用户确认商品是否适合放置
   "这个书桌尺寸为 120cm × 60cm × 75cm，请确认您的空间是否足够"
   ```

#### `attributes` 字段 (关联表)
**用途：商品规格和筛选**

```sql
ProductAttribute 示例：
id | product_id | name    | value
1  | 100       | 颜色     | 红色
2  | 100       | 尺码     | XL
3  | 100       | 材质     | 纯棉
4  | 100       | 品牌     | Nike
```

**业务场景：**
1. **商品规格展示**
   ```typescript
   // 在商品详情页展示规格
   attributes.map(attr => (
     <div key={attr.id}>
       <span>{attr.name}:</span>
       <span>{attr.value}</span>
     </div>
   ))
   ```

2. **筛选功能**
   ```typescript
   // 用户按颜色筛选商品
   const redProducts = await prisma.product.findMany({
     where: {
       attributes: {
         some: {
           name: "颜色",
           value: "红色"
         }
       }
     }
   });
   ```

3. **库存管理**（SKU变体）
   ```typescript
   // 不同颜色尺码的库存管理
   const redXLStock = await getStockByAttributes(productId, {
     颜色: "红色",
     尺码: "XL"
   });
   ```

### 为什么不冗余？

**数据用途完全不同：**
- `dimensions`：**计算型数据**，用于算法和系统逻辑
- `attributes`：**展示型数据**，用于用户界面和筛选

**查询模式不同：**
- `dimensions`：通常整体读取，用于计算
- `attributes`：经常按键值对查询，用于筛选

**扩展性不同：**
- `dimensions`：结构相对固定（长宽高重）
- `attributes`：完全动态，不同商品类别有不同属性

## 2. 评论有用性投票系统

### `helpful_count` 字段的业务价值

#### 类似系统参考
- **淘宝**："有用(1234)" 按钮
- **京东**："有用(567)" / "没用(12)" 
- **亚马逊**："Helpful" 投票系统
- **大众点评**："赞(890)" 功能

#### 完整的投票业务流程

```typescript
// 1. 用户查看评论
const reviews = await prisma.productReview.findMany({
  where: { product_id: productId },
  orderBy: { helpful_count: 'desc' }, // 按有用性排序
  include: {
    user: true,
    media: true,
    helpful_votes: {
      where: { user_id: currentUserId } // 检查当前用户是否已投票
    }
  }
});

// 2. 用户点击"有用"按钮
async function voteHelpful(reviewId: number, userId: number, isHelpful: boolean) {
  await prisma.$transaction(async (tx) => {
    // 创建或更新投票记录
    await tx.reviewHelpfulVote.upsert({
      where: {
        review_id_user_id: { review_id: reviewId, user_id: userId }
      },
      create: {
        review_id: reviewId,
        user_id: userId,
        is_helpful: isHelpful
      },
      update: {
        is_helpful: isHelpful
      }
    });
    
    // 重新计算有用数（冗余字段，提升查询性能）
    const helpfulCount = await tx.reviewHelpfulVote.count({
      where: {
        review_id: reviewId,
        is_helpful: true
      }
    });
    
    // 更新评论的有用数
    await tx.productReview.update({
      where: { id: reviewId },
      data: { helpful_count: helpfulCount }
    });
  });
}
```

#### 前端展示效果

```tsx
function ReviewCard({ review, currentUserId }) {
  const userVote = review.helpful_votes[0]; // 当前用户的投票
  
  return (
    <div className="review-card">
      <div className="review-content">{review.content}</div>
      <div className="review-actions">
        <button 
          className={userVote?.is_helpful ? 'voted' : ''}
          onClick={() => voteHelpful(review.id, true)}
        >
          👍 有用 ({review.helpful_count})
        </button>
        <button 
          className={userVote?.is_helpful === false ? 'voted' : ''}
          onClick={() => voteHelpful(review.id, false)}
        >
          👎 没用
        </button>
      </div>
    </div>
  );
}
```

#### 业务价值

1. **提升用户体验**
   - 高质量评论排在前面
   - 用户快速找到有价值的评论
   - 减少阅读无用评论的时间

2. **商家价值**
   - 真实有用的评论提升转化率
   - 减少恶意差评的影响
   - 鼓励用户写高质量评论

3. **平台价值**
   - 提升整体评论质量
   - 增加用户参与度
   - 建立社区氛围

### 为什么使用冗余字段？

#### `helpful_count` 冗余设计的原因

```sql
-- 不使用冗余字段（每次查询都要计算）
SELECT r.*, COUNT(v.id) as helpful_count 
FROM ProductReview r 
LEFT JOIN ReviewHelpfulVote v ON r.id = v.review_id AND v.is_helpful = true
GROUP BY r.id 
ORDER BY helpful_count DESC;

-- 使用冗余字段（直接排序，性能更好）
SELECT * FROM ProductReview 
ORDER BY helpful_count DESC;
```

**性能优势：**
- 避免每次查询都要JOIN和COUNT
- 排序性能大幅提升
- 减少数据库负载

**一致性保证：**
- 通过事务确保数据一致性
- 可以定期校验和修复数据
- 关键业务逻辑仍基于明细表

## 3. 实际业务场景示例

### 场景1：用户购买手机

```typescript
// 商品信息
const phone = {
  name: "iPhone 15 Pro",
  dimensions: { length: 14.67, width: 7.09, height: 0.83, unit: "cm" },
  attributes: [
    { name: "颜色", value: "深空黑" },
    { name: "存储", value: "256GB" },
    { name: "网络", value: "5G" },
    { name: "品牌", value: "Apple" }
  ]
};

// 物流计算使用 dimensions
const shippingCost = calculateShipping(phone.dimensions, userAddress);

// 筛选使用 attributes
const similarPhones = findSimilarProducts({
  brand: "Apple",
  storage: "256GB"
});
```

### 场景2：用户查看评论

```typescript
// 评论列表（按有用性排序）
const reviews = await getReviews(productId, {
  orderBy: 'helpful_count',
  include: ['media', 'user_vote']
});

// 显示评论
reviews.forEach(review => {
  console.log(`
    用户: ${review.user.name}
    评分: ${'⭐'.repeat(review.rating)}
    内容: ${review.content}
    有用: ${review.helpful_count} 人觉得有用
    ${review.user_vote ? '(您已投票)' : ''}
  `);
});
```

## 总结

这种设计充分考虑了：

1. **业务场景的多样性**：不同字段服务于不同的业务需求
2. **查询性能**：合理使用冗余字段提升关键查询性能
3. **扩展性**：为未来功能扩展预留空间
4. **用户体验**：通过数据结构设计提升用户体验

每个字段都有其特定的业务价值，不是简单的数据冗余，而是针对不同业务场景的优化设计。

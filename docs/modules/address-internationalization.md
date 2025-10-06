# 国际地址系统设计

## 概述

本文档详细说明了万花电商系统的国际地址设计，确保系统能够支持全球范围内的收货地址管理，满足跨境电商业务需求。

## 设计原则

### 1. 国际化兼容性
- 支持全球主要国家和地区的地址格式
- 使用国际标准（ISO 3166-1 alpha-2）国家代码
- 支持多语言地址输入和显示

### 2. 灵活性
- 支持多行地址输入，适应不同国家的地址结构
- 可选字段设计，满足不同地区的地址要求
- 支持B2B和B2C业务场景

### 3. 可扩展性
- 预留地址验证和标准化接口
- 支持第三方地址验证服务集成
- 支持地址数据本地化

## 地址字段设计

### 核心字段

#### 收货人信息
```typescript
{
  name: string;           // 收货人姓名（必填）
  phone: string;          // 收货人电话（必填，国际格式）
  company?: string;       // 公司名称（可选，B2B业务）
}
```

#### 地址信息
```typescript
{
  country: string;        // 国家（必填，ISO 3166-1 alpha-2）
  province: string;       // 省/州/大区（必填）
  city: string;          // 城市（必填）
  district?: string;      // 区/县/郡（可选）
  postal_code?: string;   // 邮政编码/邮编（可选）
}
```

#### 详细地址（多行支持）
```typescript
{
  address_line_1: string; // 地址第一行（必填，街道、门牌号等）
  address_line_2?: string; // 地址第二行（可选，公寓号、楼层等）
  address_line_3?: string; // 地址第三行（可选，特殊说明等）
}
```

#### 地址验证和标准化
```typescript
{
  is_verified?: boolean;  // 地址是否已验证
  verification_level?: 'none' | 'partial' | 'full'; // 验证级别
  standardized_address?: string; // 标准化后的完整地址
}
```

## 国际地址格式示例

### 中国地址格式
```json
{
  "name": "张三",
  "phone": "+86 138 0013 8000",
  "company": "深圳科技有限公司",
  "country": "CN",
  "province": "Guangdong",
  "city": "Shenzhen",
  "district": "Nanshan District",
  "postal_code": "518000",
  "address_line_1": "科技园南区深南大道10000号",
  "address_line_2": "腾讯大厦A座15楼",
  "address_line_3": "靠近地铁站"
}
```

### 美国地址格式
```json
{
  "name": "John Smith",
  "phone": "+1 555 123 4567",
  "company": "ABC Corporation",
  "country": "US",
  "province": "California",
  "city": "San Francisco",
  "district": "San Francisco County",
  "postal_code": "94102",
  "address_line_1": "123 Market Street",
  "address_line_2": "Suite 456, Floor 2",
  "address_line_3": "Near Union Square"
}
```

### 英国地址格式
```json
{
  "name": "James Wilson",
  "phone": "+44 20 7946 0958",
  "company": "London Tech Ltd",
  "country": "GB",
  "province": "England",
  "city": "London",
  "district": "Westminster",
  "postal_code": "SW1A 1AA",
  "address_line_1": "10 Downing Street",
  "address_line_2": "Apartment 5B",
  "address_line_3": "Whitehall"
}
```

## 地址验证服务

### 基础验证
- 必填字段验证
- 电话号码格式验证（国际格式）
- 国家代码格式验证（ISO 3166-1 alpha-2）
- 地址完整性验证

### 高级验证（TODO）
- 第三方地址验证服务集成
- 地址标准化和格式化
- 地址存在性验证
- 邮政编码验证

### 支持的第三方服务
- Google Maps Geocoding API
- SmartyStreets
- Loqate
- Addressy

## API 接口

### 地址管理接口

#### 获取国家列表
- **路径**: `GET /api/address/countries`
- **功能**: 获取支持的国家列表
- **返回**: 国家代码、英文名称、中文名称

#### 获取省/州列表
- **路径**: `GET /api/address/provinces/:countryCode`
- **功能**: 根据国家代码获取省/州列表
- **参数**: countryCode - 国家代码
- **返回**: 省/州代码、英文名称、中文名称

#### 验证地址
- **路径**: `POST /api/address/validate`
- **功能**: 验证和标准化地址
- **参数**: ShippingAddressDto
- **返回**: 验证结果、标准化地址、建议

## 数据库设计

### 地址存储
地址信息以JSON格式存储在订单表的 `shipping_address` 字段中，支持灵活的数据结构：

```sql
-- 订单表中的地址字段
shipping_address JSON -- 存储完整的地址信息
```

### 地址索引
为了支持地址查询和统计，可以考虑添加以下索引：
- 国家代码索引
- 城市索引
- 邮政编码索引

## 前端集成建议

### 地址输入组件
1. **国家选择器**: 下拉选择，支持搜索
2. **省/州选择器**: 根据国家动态加载
3. **城市输入**: 支持自动补全
4. **地址行输入**: 多行文本输入
5. **实时验证**: 输入时进行基础验证

### 地址显示组件
1. **标准化显示**: 按照当地格式显示地址
2. **多语言支持**: 根据用户语言偏好显示
3. **地址编辑**: 支持地址修改和更新

## 最佳实践

### 1. 地址输入
- 提供清晰的字段标签和示例
- 支持地址自动补全和验证
- 提供地址格式说明和帮助

### 2. 地址验证
- 实时验证用户输入
- 提供友好的错误提示
- 支持地址建议和修正

### 3. 地址存储
- 保存原始输入和标准化地址
- 支持地址历史记录
- 定期清理无效地址

### 4. 地址显示
- 根据地区习惯格式化显示
- 支持多语言地址显示
- 提供地址打印和分享功能

## 扩展功能

### 1. 地址簿管理
- 用户地址簿功能
- 默认地址设置
- 地址标签和分类

### 2. 地址分析
- 地址使用统计
- 配送区域分析
- 地址质量评估

### 3. 地址服务集成
- 物流公司地址验证
- 地址标准化服务
- 地址变更通知

## 安全考虑

### 1. 数据保护
- 地址数据加密存储
- 访问权限控制
- 数据脱敏处理

### 2. 隐私保护
- 符合GDPR等隐私法规
- 用户数据删除权
- 数据使用透明度

## 性能优化

### 1. 缓存策略
- 国家/省/州列表缓存
- 地址验证结果缓存
- 地址标准化缓存

### 2. 数据库优化
- 地址字段索引优化
- 查询性能优化
- 数据分片策略

## 监控和日志

### 1. 地址验证监控
- 验证成功率统计
- 验证响应时间监控
- 错误率分析

### 2. 地址质量监控
- 地址完整性统计
- 地址格式正确率
- 用户反馈分析

## 总结

通过以上设计，万花电商系统的地址管理功能能够：

1. **支持全球业务**: 兼容主要国家和地区的地址格式
2. **提供良好体验**: 智能验证和自动补全功能
3. **保证数据质量**: 地址标准化和验证机制
4. **支持业务扩展**: 灵活的架构设计，易于扩展

这套地址系统设计参考了国际主流电商平台的最佳实践，能够满足跨境电商业务的复杂需求，为用户提供便捷、准确的地址管理体验。

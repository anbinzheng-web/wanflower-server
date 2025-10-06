import { ApiProperty } from '@nestjs/swagger';

// 订单详情响应DTO
export class OrderWithDetailsDto {
  @ApiProperty({ description: '订单ID', example: 1 })
  id: number;

  @ApiProperty({ description: '订单号', example: 'ORD202401010001' })
  order_number: string;

  @ApiProperty({ description: '用户ID', example: 1 })
  user_id: number;

  @ApiProperty({ description: '订单状态', example: 'PENDING' })
  status: string;

  @ApiProperty({ description: '商品小计', example: 100.00 })
  subtotal: number;

  @ApiProperty({ description: '运费', example: 10.00 })
  shipping_fee: number;

  @ApiProperty({ description: '税费', example: 5.00 })
  tax_amount: number;

  @ApiProperty({ description: '折扣金额', example: 0.00 })
  discount_amount: number;

  @ApiProperty({ description: '总金额', example: 115.00 })
  total_amount: number;

  @ApiProperty({ description: '收货地址', type: 'object', additionalProperties: true })
  shipping_address: any;

  @ApiProperty({ description: '支付方式', example: 'alipay' })
  payment_method?: string;

  @ApiProperty({ description: '支付状态', example: 'PENDING' })
  payment_status: string;

  @ApiProperty({ description: '第三方支付ID', example: 'pay_123456789' })
  payment_id?: string;

  @ApiProperty({ description: '支付时间', example: '2024-01-01T10:00:00Z' })
  paid_at?: Date;

  @ApiProperty({ description: '物流方式', example: 'express' })
  shipping_method?: string;

  @ApiProperty({ description: '物流单号', example: 'SF1234567890' })
  tracking_number?: string;

  @ApiProperty({ description: '发货时间', example: '2024-01-01T10:00:00Z' })
  shipped_at?: Date;

  @ApiProperty({ description: '签收时间', example: '2024-01-01T10:00:00Z' })
  delivered_at?: Date;

  @ApiProperty({ description: '客户备注', example: '请小心轻放' })
  customer_notes?: string;

  @ApiProperty({ description: '管理员备注', example: '客户要求加急处理' })
  admin_notes?: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T10:00:00Z' })
  updated_at: Date;

  @ApiProperty({ description: '订单项列表', type: 'array' })
  items: any[];

  @ApiProperty({ description: '用户信息', type: 'object', additionalProperties: true })
  user: any;
}

// 订单统计响应DTO
export class OrderStatsDto {
  @ApiProperty({ description: '总订单数', example: 100 })
  total_orders: number;

  @ApiProperty({ description: '总金额', example: 10000.00 })
  total_amount: number;

  @ApiProperty({ description: '待付款订单数', example: 10 })
  pending_orders: number;

  @ApiProperty({ description: '已付款订单数', example: 20 })
  paid_orders: number;

  @ApiProperty({ description: '已发货订单数', example: 30 })
  shipped_orders: number;

  @ApiProperty({ description: '已完成订单数', example: 25 })
  completed_orders: number;

  @ApiProperty({ description: '已取消订单数', example: 5 })
  cancelled_orders: number;

  @ApiProperty({ description: '已退款订单数', example: 2 })
  refunded_orders: number;
}

// 购物车响应DTO
export class CartResponseDto {
  @ApiProperty({ description: '购物车ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户ID', example: 1 })
  user_id: number;

  @ApiProperty({ description: '购物车项列表', type: 'array' })
  items: any[];

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T10:00:00Z' })
  updated_at: Date;
}

// 购物车商品数量响应DTO
export class CartCountResponseDto {
  @ApiProperty({ description: '购物车商品数量', example: 5 })
  count: number;
}

// 购物车验证响应DTO
export class CartValidationResponseDto {
  @ApiProperty({ description: '是否有效', example: true })
  valid: boolean;

  @ApiProperty({ description: '无效商品列表', type: 'array' })
  invalidItems: any[];
}

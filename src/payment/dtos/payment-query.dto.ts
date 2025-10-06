import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

// 支付方式枚举
export enum PaymentMethod {
  CASH = 'CASH',                    // 现金
  BANK_TRANSFER = 'BANK_TRANSFER',  // 银行转账
  WIRE_TRANSFER = 'WIRE_TRANSFER',  // 电汇
  CHECK = 'CHECK',                  // 支票
  STRIPE = 'STRIPE',               // Stripe支付
  PAYPAL = 'PAYPAL',               // PayPal支付
  ALIPAY = 'ALIPAY',               // 支付宝
  WECHAT_PAY = 'WECHAT_PAY',       // 微信支付
  OTHER = 'OTHER'                  // 其他
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'PENDING',    // 待支付
  PAID = 'PAID',          // 已支付
  FAILED = 'FAILED',      // 支付失败
  REFUNDED = 'REFUNDED',  // 已退款
  CANCELLED = 'CANCELLED' // 已取消
}

// 排序字段枚举
export enum PaymentSortBy {
  CREATED_AT = 'created_at',
  PAID_AT = 'paid_at',
  AMOUNT = 'amount',
  PAYMENT_METHOD = 'payment_method'
}

// 排序方向枚举
export enum PaymentSortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ 
    description: '页码', 
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: '每页数量', 
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  page_size?: number = 10;

  @ApiPropertyOptional({ 
    description: '搜索关键词（订单号、用户邮箱、支付ID）', 
    example: 'ORD-2024-001'
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @ApiPropertyOptional({ 
    description: '支付方式', 
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: '支付方式无效' })
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({ 
    description: '支付状态', 
    enum: PaymentStatus,
    example: PaymentStatus.PAID
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: '支付状态无效' })
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ 
    description: '开始日期', 
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString({}, { message: '开始日期格式无效' })
  start_date?: string;

  @ApiPropertyOptional({ 
    description: '结束日期', 
    example: '2024-01-31'
  })
  @IsOptional()
  @IsDateString({}, { message: '结束日期格式无效' })
  end_date?: string;

  @ApiPropertyOptional({ 
    description: '最小金额', 
    example: 100.00
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: '最小金额必须是数字' })
  min_amount?: number;

  @ApiPropertyOptional({ 
    description: '最大金额', 
    example: 1000.00
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: '最大金额必须是数字' })
  max_amount?: number;

  @ApiPropertyOptional({ 
    description: '排序字段', 
    enum: PaymentSortBy,
    example: PaymentSortBy.CREATED_AT
  })
  @IsOptional()
  @IsEnum(PaymentSortBy, { message: '排序字段无效' })
  sort_by?: PaymentSortBy = PaymentSortBy.CREATED_AT;

  @ApiPropertyOptional({ 
    description: '排序方向', 
    enum: PaymentSortOrder,
    example: PaymentSortOrder.DESC
  })
  @IsOptional()
  @IsEnum(PaymentSortOrder, { message: '排序方向无效' })
  sort_order?: PaymentSortOrder = PaymentSortOrder.DESC;
}

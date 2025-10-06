import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// 订单查询DTO
export class OrderQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '用户ID必须是整数' })
  @Min(1, { message: '用户ID必须大于0' })
  user_id?: number;

  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: '订单状态必须是有效的枚举值' })
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '支付状态', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: '支付状态必须是有效的枚举值' })
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ description: '订单号', example: 'ORD202401010001' })
  @IsOptional()
  @IsString({ message: '订单号必须是字符串' })
  order_number?: string;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsDateString({}, { message: '开始日期必须是有效的日期格式' })
  start_date?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: '结束日期必须是有效的日期格式' })
  end_date?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  page_size?: number = 10;

  @ApiPropertyOptional({ 
    description: '排序字段', 
    enum: ['created_at', 'total_amount', 'order_number'],
    example: 'created_at'
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sort_by?: 'created_at' | 'total_amount' | 'order_number' = 'created_at';

  @ApiPropertyOptional({ 
    description: '排序顺序', 
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsString({ message: '排序顺序必须是字符串' })
  sort_order?: 'asc' | 'desc' = 'desc';
}

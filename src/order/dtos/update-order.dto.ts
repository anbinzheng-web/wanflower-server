import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// 更新订单DTO
export class UpdateOrderDto {
  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: '订单状态必须是有效的枚举值' })
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '支付状态', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: '支付状态必须是有效的枚举值' })
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ description: '第三方支付ID', example: 'pay_123456789' })
  @IsOptional()
  @IsString({ message: '第三方支付ID必须是字符串' })
  payment_id?: string;

  @ApiPropertyOptional({ description: '支付时间', example: '2024-01-01T10:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: '支付时间必须是有效的日期格式' })
  paid_at?: string;

  @ApiPropertyOptional({ description: '物流方式', example: 'express' })
  @IsOptional()
  @IsString({ message: '物流方式必须是字符串' })
  shipping_method?: string;

  @ApiPropertyOptional({ description: '物流单号', example: 'SF1234567890' })
  @IsOptional()
  @IsString({ message: '物流单号必须是字符串' })
  tracking_number?: string;

  @ApiPropertyOptional({ description: '发货时间', example: '2024-01-01T10:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: '发货时间必须是有效的日期格式' })
  shipped_at?: string;

  @ApiPropertyOptional({ description: '签收时间', example: '2024-01-01T10:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: '签收时间必须是有效的日期格式' })
  delivered_at?: string;

  @ApiPropertyOptional({ description: '管理员备注', example: '客户要求加急处理' })
  @IsOptional()
  @IsString({ message: '管理员备注必须是字符串' })
  admin_notes?: string;
}

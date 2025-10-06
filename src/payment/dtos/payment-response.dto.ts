import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from './payment-query.dto';

// 支付日志响应DTO
export class PaymentLogDto {
  @ApiProperty({ description: '支付日志ID', example: 1 })
  id: number;

  @ApiProperty({ description: '订单ID', example: 1 })
  order_id: number;

  @ApiProperty({ description: '支付方式', enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  payment_method: PaymentMethod;

  @ApiProperty({ description: '支付金额', example: 299.99 })
  amount: number;

  @ApiPropertyOptional({ description: '第三方支付ID', example: 'pi_1234567890abcdef' })
  payment_id?: string;

  @ApiProperty({ description: '支付时间', example: '2024-01-15T10:30:00Z' })
  paid_at: Date;

  @ApiPropertyOptional({ description: '支付备注', example: '银行转账，交易号：123456789' })
  payment_notes?: string;

  @ApiPropertyOptional({ description: '交易凭证号', example: 'TXN20240115001' })
  transaction_reference?: string;

  @ApiPropertyOptional({ description: '银行名称', example: '中国工商银行' })
  bank_name?: string;

  @ApiPropertyOptional({ description: '账户后四位', example: '1234' })
  account_last_four?: string;

  @ApiProperty({ description: '确认支付的管理员ID', example: 1 })
  admin_id: number;

  @ApiProperty({ description: '创建时间', example: '2024-01-15T10:30:00Z' })
  created_at: Date;
}

// 用户信息DTO
export class UserInfoDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'john_doe' })
  username: string;

  @ApiProperty({ description: '用户邮箱', example: 'john@example.com' })
  email: string;
}

// 订单信息DTO
export class OrderInfoDto {
  @ApiProperty({ description: '订单ID', example: 1 })
  id: number;

  @ApiProperty({ description: '订单号', example: 'ORD-2024-001' })
  order_number: string;

  @ApiProperty({ description: '订单状态', example: 'PAID' })
  status: string;

  @ApiProperty({ description: '订单总金额', example: 299.99 })
  total_amount: number;

  @ApiProperty({ description: '用户信息', type: UserInfoDto })
  user: UserInfoDto;
}

// 管理员信息DTO
export class AdminInfoDto {
  @ApiProperty({ description: '管理员ID', example: 1 })
  id: number;

  @ApiProperty({ description: '管理员用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '管理员邮箱', example: 'admin@example.com' })
  email: string;
}

// 支付详情响应DTO（包含订单和用户信息）
export class PaymentDetailDto extends PaymentLogDto {
  @ApiProperty({ description: '订单信息', type: OrderInfoDto })
  order: OrderInfoDto;

  @ApiProperty({ description: '管理员信息', type: AdminInfoDto })
  admin: AdminInfoDto;
}

// 支付统计响应DTO
export class PaymentStatsDto {
  @ApiProperty({ description: '总支付记录数', example: 150 })
  total_payments: number;

  @ApiProperty({ description: '总支付金额', example: 45000.00 })
  total_amount: number;

  @ApiProperty({ description: '今日支付记录数', example: 5 })
  today_payments: number;

  @ApiProperty({ description: '今日支付金额', example: 1500.00 })
  today_amount: number;

  @ApiProperty({ description: '本月支付记录数', example: 45 })
  month_payments: number;

  @ApiProperty({ description: '本月支付金额', example: 13500.00 })
  month_amount: number;

  @ApiProperty({ description: '按支付方式统计' })
  by_payment_method: {
    [key in PaymentMethod]: {
      count: number;
      amount: number;
    };
  };

  @ApiProperty({ description: '按支付状态统计' })
  by_payment_status: {
    [key in PaymentStatus]: {
      count: number;
      amount: number;
    };
  };
}

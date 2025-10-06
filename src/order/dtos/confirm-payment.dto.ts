import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';

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

// 确认支付DTO
export class ConfirmPaymentDto {
  @ApiProperty({ 
    description: '支付方式', 
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER 
  })
  @IsNotEmpty({ message: '支付方式不能为空' })
  @IsEnum(PaymentMethod, { message: '支付方式无效' })
  payment_method: PaymentMethod;

  @ApiProperty({ 
    description: '支付金额', 
    example: 299.99 
  })
  @IsNotEmpty({ message: '支付金额不能为空' })
  @IsNumber({}, { message: '支付金额必须是数字' })
  @Min(0.01, { message: '支付金额必须大于0' })
  amount: number;

  @ApiProperty({ 
    description: '第三方支付ID（如Stripe Payment Intent ID）', 
    example: 'pi_1234567890abcdef' 
  })
  @IsOptional()
  @IsString({ message: '第三方支付ID必须是字符串' })
  payment_id?: string;

  @ApiProperty({ 
    description: '支付时间', 
    example: '2024-01-15T10:30:00Z' 
  })
  @IsNotEmpty({ message: '支付时间不能为空' })
  @IsDateString({}, { message: '支付时间格式无效' })
  paid_at: string;

  @ApiPropertyOptional({ 
    description: '支付备注', 
    example: '银行转账，交易号：123456789' 
  })
  @IsOptional()
  @IsString({ message: '支付备注必须是字符串' })
  payment_notes?: string;

  @ApiPropertyOptional({ 
    description: '交易凭证号', 
    example: 'TXN20240115001' 
  })
  @IsOptional()
  @IsString({ message: '交易凭证号必须是字符串' })
  transaction_reference?: string;

  @ApiPropertyOptional({ 
    description: '银行名称（银行转账时使用）', 
    example: '中国工商银行' 
  })
  @IsOptional()
  @IsString({ message: '银行名称必须是字符串' })
  bank_name?: string;

  @ApiPropertyOptional({ 
    description: '账户后四位（银行转账时使用）', 
    example: '1234' 
  })
  @IsOptional()
  @IsString({ message: '账户后四位必须是字符串' })
  account_last_four?: string;
}

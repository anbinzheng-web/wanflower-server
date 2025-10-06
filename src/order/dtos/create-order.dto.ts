import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// 收货地址DTO - 支持国际地址格式
export class ShippingAddressDto {
  // 收货人信息
  @ApiProperty({ description: '收货人姓名', example: 'John Smith' })
  @IsNotEmpty({ message: '收货人姓名不能为空' })
  @IsString({ message: '收货人姓名必须是字符串' })
  name: string;

  @ApiProperty({ description: '收货人电话（国际格式）', example: '+86 138 0013 8000' })
  @IsNotEmpty({ message: '收货人电话不能为空' })
  @IsString({ message: '收货人电话必须是字符串' })
  phone: string;

  @ApiPropertyOptional({ description: '公司名称', example: 'ABC Company Ltd.' })
  @IsOptional()
  @IsString({ message: '公司名称必须是字符串' })
  company?: string;

  // 地址信息
  @ApiProperty({ description: '国家（ISO 3166-1 alpha-2 代码）', example: 'CN' })
  @IsNotEmpty({ message: '国家不能为空' })
  @IsString({ message: '国家必须是字符串' })
  country: string;

  @ApiProperty({ description: '省/州/大区', example: 'Guangdong' })
  @IsNotEmpty({ message: '省/州不能为空' })
  @IsString({ message: '省/州必须是字符串' })
  province: string;

  @ApiProperty({ description: '城市', example: 'Shenzhen' })
  @IsNotEmpty({ message: '城市不能为空' })
  @IsString({ message: '城市必须是字符串' })
  city: string;

  @ApiPropertyOptional({ description: '区/县/郡', example: 'Nanshan District' })
  @IsOptional()
  @IsString({ message: '区/县必须是字符串' })
  district?: string;

  @ApiPropertyOptional({ description: '邮政编码/邮编', example: '518000' })
  @IsOptional()
  @IsString({ message: '邮政编码必须是字符串' })
  postal_code?: string;

  // 详细地址（多行支持）
  @ApiProperty({ description: '地址第一行（街道、门牌号等）', example: '123 Main Street' })
  @IsNotEmpty({ message: '地址第一行不能为空' })
  @IsString({ message: '地址第一行必须是字符串' })
  address_line_1: string;

  @ApiPropertyOptional({ description: '地址第二行（公寓号、楼层等）', example: 'Apt 456, Floor 2' })
  @IsOptional()
  @IsString({ message: '地址第二行必须是字符串' })
  address_line_2?: string;

  @ApiPropertyOptional({ description: '地址第三行（特殊说明等）', example: 'Building B, Near Metro Station' })
  @IsOptional()
  @IsString({ message: '地址第三行必须是字符串' })
  address_line_3?: string;
}

// 订单项DTO
export class OrderItemDto {
  @ApiProperty({ description: '商品ID', example: 1 })
  @IsNotEmpty({ message: '商品ID不能为空' })
  @IsInt({ message: '商品ID必须是整数' })
  @Min(1, { message: '商品ID必须大于0' })
  product_id: number;

  @ApiProperty({ description: '商品数量', example: 2 })
  @IsNotEmpty({ message: '商品数量不能为空' })
  @IsInt({ message: '商品数量必须是整数' })
  @Min(1, { message: '商品数量必须大于0' })
  @Max(999, { message: '商品数量不能超过999' })
  quantity: number;
}

// 创建订单DTO
export class CreateOrderDto {
  @ApiPropertyOptional({ description: '用户ID（管理员代下单时使用）', example: 1 })
  @IsOptional()
  @IsInt({ message: '用户ID必须是整数' })
  @Min(1, { message: '用户ID必须大于0' })
  user_id?: number;

  @ApiProperty({ description: '收货地址', type: ShippingAddressDto })
  @IsNotEmpty({ message: '收货地址不能为空' })
  @IsObject({ message: '收货地址必须是对象' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping_address: ShippingAddressDto;

  @ApiProperty({ description: '订单项列表', type: [OrderItemDto] })
  @IsNotEmpty({ message: '订单项列表不能为空' })
  @IsArray({ message: '订单项列表必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: '客户备注', example: '请小心轻放' })
  @IsOptional()
  @IsString({ message: '客户备注必须是字符串' })
  customer_notes?: string;

  @ApiPropertyOptional({ description: '支付方式', example: 'alipay' })
  @IsOptional()
  @IsString({ message: '支付方式必须是字符串' })
  payment_method?: string;

  @ApiPropertyOptional({ description: '物流方式', example: 'express' })
  @IsOptional()
  @IsString({ message: '物流方式必须是字符串' })
  shipping_method?: string;
}

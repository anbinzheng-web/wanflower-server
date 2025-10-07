import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// 管理员购物车查询DTO
export class AdminCartQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '用户ID必须是整数' })
  @Min(1, { message: '用户ID必须大于0' })
  user_id?: number;

  @ApiPropertyOptional({ description: '用户邮箱', example: 'user@example.com' })
  @IsOptional()
  @IsString({ message: '用户邮箱必须是字符串' })
  user_email?: string;

  @ApiPropertyOptional({ description: '商品ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '商品ID必须是整数' })
  @Min(1, { message: '商品ID必须大于0' })
  product_id?: number;

  @ApiPropertyOptional({ description: '商品名称', example: '商品名称' })
  @IsOptional()
  @IsString({ message: '商品名称必须是字符串' })
  product_name?: string;

  @ApiPropertyOptional({ description: '最小数量', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '最小数量必须是整数' })
  @Min(1, { message: '最小数量必须大于0' })
  min_quantity?: number;

  @ApiPropertyOptional({ description: '最大数量', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '最大数量必须是整数' })
  @Min(1, { message: '最大数量必须大于0' })
  max_quantity?: number;

  @ApiPropertyOptional({ description: '创建时间开始', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: '创建时间开始格式不正确' })
  created_at_start?: string;

  @ApiPropertyOptional({ description: '创建时间结束', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString({}, { message: '创建时间结束格式不正确' })
  created_at_end?: string;

  @ApiPropertyOptional({ description: '更新时间开始', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: '更新时间开始格式不正确' })
  updated_at_start?: string;

  @ApiPropertyOptional({ description: '更新时间结束', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString({}, { message: '更新时间结束格式不正确' })
  updated_at_end?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  page_size?: number = 10;

  @ApiPropertyOptional({ description: '排序字段', example: 'created_at' })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是asc或desc' })
  sort_order?: 'asc' | 'desc' = 'desc';
}

// 管理员购物车项DTO
export class AdminCartItemDto {
  @ApiProperty({ description: '购物车项ID', example: 1 })
  id: number;

  @ApiProperty({ description: '购物车ID', example: 1 })
  cart_id: number;

  @ApiProperty({ description: '商品ID', example: 1 })
  product_id: number;

  @ApiProperty({ description: '商品数量', example: 2 })
  quantity: number;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T10:00:00Z' })
  updated_at: Date;

  @ApiProperty({ description: '商品信息' })
  product: {
    id: number;
    name: string;
    price: number;
    original_price: number;
    stock: number;
    status: string;
    media?: Array<{
      local_path: string;
      cdn_url: string;
      type: string;
    }>;
  };

  @ApiProperty({ description: '用户信息' })
  cart: {
    id: number;
    user_id: number;
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

// 管理员购物车响应DTO
export class AdminCartResponseDto {
  @ApiProperty({ description: '购物车ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户ID', example: 1 })
  user_id: number;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T10:00:00Z' })
  updated_at: Date;

  @ApiProperty({ description: '购物车项列表', type: [AdminCartItemDto] })
  items: AdminCartItemDto[];

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };

  @ApiProperty({ description: '购物车统计' })
  statistics: {
    total_items: number;
    total_quantity: number;
    total_value: number;
  };
}

// 管理员批量操作DTO
export class AdminBatchCartOperationDto {
  @ApiProperty({ description: '操作类型', enum: ['delete', 'update_quantity'], example: 'delete' })
  @IsNotEmpty({ message: '操作类型不能为空' })
  @IsEnum(['delete', 'update_quantity'], { message: '操作类型必须是delete或update_quantity' })
  operation: 'delete' | 'update_quantity';

  @ApiProperty({ description: '购物车项ID列表', example: [1, 2, 3] })
  @IsNotEmpty({ message: '购物车项ID列表不能为空' })
  @Type(() => Number)
  @IsInt({ each: true, message: '购物车项ID必须是整数' })
  @Min(1, { each: true, message: '购物车项ID必须大于0' })
  cart_item_ids: number[];

  @ApiPropertyOptional({ description: '新数量（仅update_quantity操作需要）', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '新数量必须是整数' })
  @Min(1, { message: '新数量必须大于0' })
  @Max(999, { message: '新数量不能超过999' })
  new_quantity?: number;
}

// 管理员购物车统计DTO
export class AdminCartStatisticsDto {
  @ApiProperty({ description: '总购物车数量', example: 100 })
  total_carts: number;

  @ApiProperty({ description: '总购物车项数量', example: 500 })
  total_cart_items: number;

  @ApiProperty({ description: '活跃购物车数量（有商品的购物车）', example: 80 })
  active_carts: number;

  @ApiProperty({ description: '总商品价值', example: 50000.00 })
  total_value: number;

  @ApiProperty({ description: '平均购物车价值', example: 500.00 })
  average_cart_value: number;

  @ApiProperty({ description: '最多商品的购物车', example: 15 })
  max_items_in_cart: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T10:00:00Z' })
  generated_at: Date;
}

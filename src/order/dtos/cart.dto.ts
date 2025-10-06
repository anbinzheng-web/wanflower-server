import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// 购物车项DTO
export class CartItemDto {
  @ApiProperty({ description: '商品ID', example: 1 })
  @IsNotEmpty({ message: '商品ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '商品ID必须是整数' })
  @Min(1, { message: '商品ID必须大于0' })
  product_id: number;

  @ApiProperty({ description: '商品数量', example: 2 })
  @IsNotEmpty({ message: '商品数量不能为空' })
  @Type(() => Number)
  @IsInt({ message: '商品数量必须是整数' })
  @Min(1, { message: '商品数量必须大于0' })
  @Max(999, { message: '商品数量不能超过999' })
  quantity: number;
}

// 更新购物车项DTO
export class UpdateCartItemDto {
  @ApiProperty({ description: '商品数量', example: 3 })
  @IsNotEmpty({ message: '商品数量不能为空' })
  @Type(() => Number)
  @IsInt({ message: '商品数量必须是整数' })
  @Min(1, { message: '商品数量必须大于0' })
  @Max(999, { message: '商品数量不能超过999' })
  quantity: number;
}

// 购物车查询DTO
export class CartQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '用户ID必须是整数' })
  @Min(1, { message: '用户ID必须大于0' })
  user_id?: number;
}

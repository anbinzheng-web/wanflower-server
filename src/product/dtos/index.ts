import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsIn, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductImageType, ProductStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { PageDto } from 'shared/dto/page.dto';

export class ProductListDto extends PageDto {
  @ApiPropertyOptional({ description: '价格排序 asc/desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  price_order?: 'asc' | 'desc';
}

export class ProductCreateDto {
  @ApiProperty({ description: '商品名称' })
  @IsNotEmpty()
  name: string;
  
  @ApiProperty({ description: '商品描述' })
  @IsNotEmpty()
  description: string;
  
  @ApiProperty({ description: '商品价格，单位分' })
  @IsNumber()
  @Type(() => Number)
  price: number;
  
  @ApiProperty({ description: '商品库存' })
  @IsInt()
  @Type(() => Number)
  stock: number;

  @ApiProperty({ description: '商品状态', enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export class ProductUpdateDto extends PartialType(ProductCreateDto) {
  @ApiProperty({ description: '商品ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class ProductImageUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiPropertyOptional({ description: '图片类型', enum: ProductImageType })
  @IsEnum(ProductImageType)
  type: ProductImageType

  @ApiPropertyOptional({ description: '排序，数字越小越靠前', default: 0 })
  @IsInt()
  @Transform(({ value }) => {
    // value 来自 form-data，通常是字符串。处理空串与 undefined
    if (value === undefined || value === null || value === '') return 99;
    const v = parseInt(value as any, 10);
    return Number.isNaN(v) ? value : v;
  }, { toClassOnly: true })
  sort: number

  @ApiPropertyOptional({ description: '商品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number
}
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PageDto } from 'shared/dto/page.dto';

export class ReviewCreateDto {
  @ApiProperty({ description: '商品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;

  @ApiProperty({ description: '用户ID', required: false })
  @IsInt()
  @Type(() => Number)
  user_id: number; // 可选，关联用户ID

  @ApiProperty({ description: '评分，1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiProperty({ description: '评论内容' })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '评论图片，最多9张', type: [String], required: false })
  images?: string[];

  @ApiProperty({ description: '订单ID', required: false })
  @IsInt()
  @Type(() => Number)
  order_id?: number; // 可选，关联订单ID
}

export class ReviewListDto extends PageDto {
  @ApiProperty({ description: '商品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;
}

export class ProductReviewUploadImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
  
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  review_id: number;
}

export class ProductReviewDeleteImageDto {
  @ApiProperty({ description: '图片文件名' })
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  review_id: number;
}
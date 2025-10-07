import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { MediaType, StorageType } from '@prisma/client';

export class MediaUploadDto {
  @ApiProperty({ description: '业务类型', enum: ['PRODUCT', 'BLOG', 'REVIEW', 'USER', 'GENERAL'] })
  @IsEnum(['PRODUCT', 'BLOG', 'REVIEW', 'USER', 'GENERAL'])
  business_type: string;

  @ApiProperty({ description: '关联的业务ID', required: false })
  @IsOptional()
  @IsInt()
  business_id?: number;

  @ApiProperty({ description: '媒体类型', enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  type: MediaType;

  @ApiProperty({ description: '替代文本', required: false })
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiProperty({ description: '排序权重', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiProperty({ description: '媒体分类', required: false, default: 'DEFAULT' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class MediaListDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  @ApiProperty({ description: '业务类型', required: false })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({ description: '关联的业务ID', required: false })
  @IsOptional()
  @IsInt()
  business_id?: number;

  @ApiProperty({ description: '媒体类型', required: false, enum: ['IMAGE', 'VIDEO'] })
  @IsOptional()
  @IsEnum(['IMAGE', 'VIDEO'])
  type?: MediaType;

  @ApiProperty({ description: '媒体分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsInt()
  user_id?: number;
}

export class MediaUpdateDto {
  @ApiProperty({ description: '媒体ID' })
  @IsInt()
  id: number;

  @ApiProperty({ description: '替代文本', required: false })
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiProperty({ description: '排序权重', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiProperty({ description: '媒体分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}

export class MediaDeleteDto {
  @ApiProperty({ description: '媒体ID' })
  @IsInt()
  id: number;
}

export class MediaBatchUploadDto {
  @ApiProperty({ description: '业务类型', enum: ['PRODUCT', 'BLOG', 'REVIEW', 'USER', 'GENERAL'] })
  @IsEnum(['PRODUCT', 'BLOG', 'REVIEW', 'USER', 'GENERAL'])
  business_type: string;

  @ApiProperty({ description: '关联的业务ID', required: false })
  @IsOptional()
  @IsInt()
  business_id?: number;

  @ApiProperty({ description: '媒体类型', enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  type: MediaType;

  @ApiProperty({ description: '媒体分类', required: false, default: 'DEFAULT' })
  @IsOptional()
  @IsString()
  category?: string;
}


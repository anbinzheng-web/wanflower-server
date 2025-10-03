import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsInt, IsNotEmpty, Min, Max, IsString, IsOptional, IsEnum, 
  IsArray, ArrayMaxSize, Length, Matches, IsBoolean, ValidateNested
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PageDto } from 'shared/dto/page.dto';
import { ReviewStatus, MediaType, StorageType } from '@prisma/client';

// ================================
// 评论查询相关 DTO
// ================================

export class ReviewListDto extends PageDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;

  @ApiPropertyOptional({ description: '评分筛选', enum: [1, 2, 3, 4, 5] })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ description: '审核状态筛选', enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: '是否有媒体文件' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  has_media?: boolean;

  @ApiPropertyOptional({ description: '排序方式', enum: ['newest', 'oldest', 'helpful', 'rating_high', 'rating_low'] })
  @IsOptional()
  @IsString()
  sort_by?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
}

export class ReviewDetailDto {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

// ================================
// 评论创建/更新相关 DTO
// ================================

export class ReviewCreateDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;

  @ApiProperty({ description: '订单ID' })
  @IsInt()
  @Type(() => Number)
  order_id: number;

  @ApiProperty({ description: '评分，1-5星' })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiProperty({ description: '评论内容' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 2000, { message: '评论内容长度必须在10-2000字符之间' })
  @Transform(({ value }) => {
    // 安全处理：去除HTML标签，防止XSS攻击
    return typeof value === 'string' ? 
      value.replace(/<[^>]*>/g, '').trim() : value;
  })
  content: string;

  @ApiPropertyOptional({ description: '父评论ID（用于回复）' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent_id?: number;
}

export class ReviewUpdateDto extends PartialType(ReviewCreateDto) {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

// ================================
// 评论媒体文件相关 DTO
// ================================

export class ReviewMediaUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: '媒体文件' })
  file: any;

  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  review_id: number;

  @ApiProperty({ description: '媒体类型', enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

export class ReviewMediaDeleteDto {
  @ApiProperty({ description: '媒体文件ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class ReviewMediaUpdateDto {
  @ApiProperty({ description: '媒体文件ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({ description: '排序权重' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

// ================================
// 评论有用性投票相关 DTO
// ================================

export class ReviewHelpfulVoteDto {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  review_id: number;

  @ApiProperty({ description: '是否有用', example: true })
  @IsBoolean()
  is_helpful: boolean;
}

// ================================
// 评论审核相关 DTO（管理员使用）
// ================================

export class ReviewModerationDto {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: '审核状态', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: '审核备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  moderation_note?: string;
}

export class ReviewBatchModerationDto {
  @ApiProperty({ description: '评论ID数组', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @ArrayMaxSize(50, { message: '一次最多处理50条评论' })
  ids: number[];

  @ApiProperty({ description: '审核状态', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: '批量审核备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  moderation_note?: string;
}

// ================================
// 管理员查询相关 DTO
// ================================

export class AdminReviewListDto extends PageDto {
  @ApiPropertyOptional({ description: '产品ID筛选' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @ApiPropertyOptional({ description: '用户ID筛选' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  user_id?: number;

  @ApiPropertyOptional({ description: '审核状态筛选', enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: '评分筛选' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => {
    // 安全处理：去除特殊字符，防止SQL注入
    return typeof value === 'string' ? 
      value.replace(/[<>'"%;()&+]/g, '').trim() : value;
  })
  keyword?: string;

  @ApiPropertyOptional({ description: '日期范围开始' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必须为YYYY-MM-DD' })
  date_from?: string;

  @ApiPropertyOptional({ description: '日期范围结束' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必须为YYYY-MM-DD' })
  date_to?: string;
}

// ================================
// 其他操作相关 DTO
// ================================

export class ReviewDeleteDto {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({ description: '删除原因' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  delete_reason?: string;
}

export class ReviewReportDto {
  @ApiProperty({ description: '评论ID' })
  @IsInt()
  @Type(() => Number)
  review_id: number;

  @ApiProperty({ description: '举报原因', enum: ['spam', 'inappropriate', 'fake', 'other'] })
  @IsString()
  @IsEnum(['spam', 'inappropriate', 'fake', 'other'])
  reason: string;

  @ApiPropertyOptional({ description: '举报详情' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Transform(({ value }) => {
    // 安全处理
    return typeof value === 'string' ? 
      value.replace(/<[^>]*>/g, '').trim() : value;
  })
  description?: string;
}

// ================================
// 统计相关 DTO
// ================================

export class ReviewStatsDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;
}
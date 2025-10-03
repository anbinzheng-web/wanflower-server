import { IsEnum, IsInt, IsJSON, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, IsNumber } from "class-validator";
import { PageDto } from "shared/dto/page.dto";
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { BlogStatus } from '@prisma/client'

export class BlogListDto extends PageDto {
  @ApiProperty({ description: '博客状态' })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus

  @ApiProperty({ description: '项目类型' })
  @IsOptional()
  @IsString()
  project_type?: string

  @ApiProperty({ description: '模糊搜索/title+md' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ description: '标签ID列表' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tag_ids?: number[]

  @ApiProperty({ description: '分类ID列表' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  category_ids?: number[]

  @ApiProperty({ description: '是否精选' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_featured?: boolean

  @ApiProperty({ description: '语言代码' })
  @IsOptional()
  @IsString()
  language?: string

  @ApiProperty({ description: '排序字段', enum: ['created_at', 'updated_at', 'view_count', 'reading_time', 'sort_order'] })
  @IsOptional()
  @IsString()
  sort_by?: string

  @ApiProperty({ description: '排序方向', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc'
}

export class BlogCreateDto {
  @ApiProperty({ description: '博客标题' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: '作者', default: 'anbin' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ description: '封面图' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiProperty({ description: 'seo 相关的数据', required: false })
  @IsOptional()
  @IsJSON()
  seo?: Record<string, any>;

  @ApiProperty({ description: 'markdown 内容（支持 HTML）' })
  @IsOptional()
  @IsString()
  md?: string;

  @ApiProperty({ description: '博客归属语言', default: 'zh' })
  @IsOptional()
  @IsString()
  language?: string

  @ApiProperty({ description: '博客摘要' })
  @IsOptional()
  @IsString()
  summary?: string

  @ApiProperty({ description: '项目类型' })
  @IsNotEmpty()
  @IsString()
  project_type: string;

  @ApiProperty({ description: '是否精选', default: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsNumber()
  sort_order?: number

  @ApiProperty({ description: '标签ID列表' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tag_ids?: number[]

  @ApiProperty({ description: '分类ID列表' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  category_ids?: number[]
}

export class BlogUpdateDto extends PartialType(BlogCreateDto) {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: '状态' })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus
}

export class BlogSlugDto {
  @ApiProperty({ description: 'slug' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ description: '项目类型' })
  @IsOptional()
  @IsString()
  project_type?: string;

  @ApiProperty({ description: '语言代码' })
  @IsOptional()
  @IsString()
  language?: string;
}

// 博客标签相关 DTO
export class BlogTagCreateDto {
  @ApiProperty({ description: '标签名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '标签 slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: '标签描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '标签颜色（十六进制）' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: '项目类型' })
  @IsNotEmpty()
  @IsString()
  project_type: string;

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class BlogTagUpdateDto extends PartialType(BlogTagCreateDto) {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class BlogTagListDto extends PageDto {
  @ApiProperty({ description: '项目类型' })
  @IsOptional()
  @IsString()
  project_type?: string;

  @ApiProperty({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiProperty({ description: '搜索标签名称' })
  @IsOptional()
  @IsString()
  search?: string;
}

// 博客分类相关 DTO
export class BlogCategoryCreateDto {
  @ApiProperty({ description: '分类名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '分类 slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: '分类描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '父分类ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent_id?: number;

  @ApiProperty({ description: '项目类型' })
  @IsNotEmpty()
  @IsString()
  project_type: string;

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class BlogCategoryUpdateDto extends PartialType(BlogCategoryCreateDto) {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class BlogCategoryListDto extends PageDto {
  @ApiProperty({ description: '项目类型' })
  @IsOptional()
  @IsString()
  project_type?: string;

  @ApiProperty({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiProperty({ description: '父分类ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent_id?: number;

  @ApiProperty({ description: '搜索分类名称' })
  @IsOptional()
  @IsString()
  search?: string;
}
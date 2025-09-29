import { IsEnum, IsInt, IsJSON, IsNotEmpty, IsOptional, IsString } from "class-validator";
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

  @ApiProperty({ description: '模糊搜索/title+md' })
  @IsOptional()
  search?: string
}

export class BlogCreateDto {
  @ApiProperty({ description: '博客标题' })
  @IsNotEmpty()
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
  seo?: Record<string, any>;

  @ApiProperty({ description: 'markdown' })
  @IsOptional()
  @IsString()
  md?: string;

  @ApiProperty({ description: '博客归属语言' })
  @IsOptional()
  @IsString()
  language?: string

  @ApiProperty({ description: '博客摘要' })
  @IsOptional()
  @IsString()
  summary?: string
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
  slug: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsInt, IsOptional, IsIn, IsEnum, IsNumber, IsNotEmpty, 
  IsString, IsArray, IsDecimal, Min, Max, IsBoolean,
  ValidateNested, ArrayMaxSize, IsUrl
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
// 临时类型定义，直到Prisma客户端生成
enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', 
  DRAFT = 'DRAFT'
}

enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

enum StorageType {
  LOCAL = 'LOCAL',
  CDN = 'CDN'
}

enum MediaCategory {
  MAIN = 'MAIN',
  GALLERY = 'GALLERY',
  DETAIL = 'DETAIL'
}
import { PartialType } from '@nestjs/mapped-types';
import { PageDto } from 'shared/dto/page.dto';

// ================================
// 产品查询相关 DTO
// ================================

export class ProductListDto extends PageDto {
  @ApiPropertyOptional({ description: '价格排序', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  price_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: '销量排序', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sales_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: '浏览量排序', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  view_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: '产品状态筛选', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: '分类ID筛选' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '最低价格筛选' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  min_price?: number;

  @ApiPropertyOptional({ description: '最高价格筛选' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  max_price?: number;
}

export class ProductDetailDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

// ================================
// 产品创建/更新相关 DTO
// ================================

export class ProductAttributeDto {
  @ApiProperty({ description: '属性名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '属性值' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

export class ProductDimensionsDto {
  @ApiProperty({ description: '长度(cm)' })
  @IsNumber()
  @Type(() => Number)
  length: number;

  @ApiProperty({ description: '宽度(cm)' })
  @IsNumber()
  @Type(() => Number)
  width: number;

  @ApiProperty({ description: '高度(cm)' })
  @IsNumber()
  @Type(() => Number)
  height: number;

  @ApiPropertyOptional({ description: '单位', default: 'cm' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class ProductCreateDto {
  @ApiProperty({ description: '商品名称' })
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @ApiProperty({ description: '商品详细描述' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: '商品简短描述' })
  @IsOptional()
  @IsString()
  short_desc?: string;
  
  @ApiProperty({ description: '商品价格' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: '商品原价' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  original_price?: number;
  
  @ApiProperty({ description: '商品库存' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional({ description: '最小库存预警', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_stock?: number;

  @ApiPropertyOptional({ description: '商品重量(kg)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ description: '商品尺寸信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional({ description: 'SKU编码' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: '条形码' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: '商品状态', enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;

  @ApiPropertyOptional({ description: 'SEO标题' })
  @IsOptional()
  @IsString()
  seo_title?: string;

  @ApiPropertyOptional({ description: 'SEO描述' })
  @IsOptional()
  @IsString()
  seo_description?: string;

  @ApiPropertyOptional({ description: 'SEO关键词', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  seo_keywords?: string[];

  @ApiPropertyOptional({ description: '商品属性', type: [ProductAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @ArrayMaxSize(50)
  attributes?: ProductAttributeDto[];
}

export class ProductUpdateDto extends PartialType(ProductCreateDto) {
  @ApiProperty({ description: '商品ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

// ================================
// 产品属性管理相关 DTO
// ================================

export class ProductAttributeCreateDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;

  @ApiProperty({ description: '属性名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '属性值' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

export class ProductAttributeUpdateDto {
  @ApiProperty({ description: '属性ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({ description: '属性名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '属性值' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: '排序权重' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

export class ProductAttributeListDto extends PageDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;
}

export class ProductAttributeDeleteDto {
  @ApiProperty({ description: '属性ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

// ================================
// 媒体文件相关 DTO
// ================================

export class ProductMediaUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: '媒体文件' })
  file: any;

  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  product_id: number;

  @ApiProperty({ description: '媒体类型', enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ description: '媒体分类', enum: MediaCategory, default: MediaCategory.MAIN })
  @IsOptional()
  @IsEnum(MediaCategory)
  media_category?: MediaCategory;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;

  @ApiPropertyOptional({ description: '替代文本' })
  @IsOptional()
  @IsString()
  alt_text?: string;
}

export class ProductMediaUpdateDto {
  @ApiProperty({ description: '媒体ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({ description: '媒体分类', enum: MediaCategory })
  @IsOptional()
  @IsEnum(MediaCategory)
  media_category?: MediaCategory;

  @ApiPropertyOptional({ description: '排序权重' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;

  @ApiPropertyOptional({ description: '替代文本' })
  @IsOptional()
  @IsString()
  alt_text?: string;
}

export class ProductMediaDeleteDto {
  @ApiProperty({ description: '媒体ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class ProductMediaMigrateToCdnDto {
  @ApiProperty({ description: '媒体ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: 'CDN URL' })
  @IsUrl()
  cdn_url: string;

  @ApiProperty({ description: 'CDN存储键' })
  @IsString()
  cdn_key: string;
}

// ================================
// 产品分类相关 DTO
// ================================

export class CategoryCreateDto {
  @ApiProperty({ description: '分类名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL友好标识' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: '分类描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '分类图片URL' })
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional({ description: '父分类ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent_id?: number;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CategoryUpdateDto extends PartialType(CategoryCreateDto) {
  @ApiProperty({ description: '分类ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class CategoryListDto extends PageDto {
  @ApiPropertyOptional({ description: '父分类ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent_id?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ================================
// 其他操作相关 DTO
// ================================

export class ProductViewDto {
  @ApiProperty({ description: '产品ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class ProductBatchDeleteDto {
  @ApiProperty({ description: '产品ID数组', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @ArrayMaxSize(100)
  ids: number[];
}

export class ProductBatchUpdateStatusDto {
  @ApiProperty({ description: '产品ID数组', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @ArrayMaxSize(100)
  ids: number[];

  @ApiProperty({ description: '目标状态', enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
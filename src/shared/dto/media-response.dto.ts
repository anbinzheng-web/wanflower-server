import { ApiProperty } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({ description: '媒体ID' })
  id: number;

  @ApiProperty({ description: '媒体URL' })
  url: string;

  @ApiProperty({ description: '缩略图URL' })
  thumbnail_url: string;

  @ApiProperty({ description: '原始文件名' })
  filename: string;

  @ApiProperty({ description: '文件大小（字节）' })
  file_size: string;

  @ApiProperty({ description: 'MIME类型' })
  mime_type: string;

  @ApiProperty({ description: '宽度', required: false })
  width?: number;

  @ApiProperty({ description: '高度', required: false })
  height?: number;

  @ApiProperty({ description: '时长（秒）', required: false })
  duration?: number;

  @ApiProperty({ description: '替代文本', required: false })
  alt_text?: string;

  @ApiProperty({ description: '排序权重' })
  sort_order: number;

  @ApiProperty({ description: '媒体分类' })
  category: string;

  @ApiProperty({ description: '创建时间' })
  created_at: Date;
}

export class BlogMediaResponseDto extends MediaResponseDto {
  @ApiProperty({ description: '业务类型' })
  business_type: string;

  @ApiProperty({ description: '关联的业务ID' })
  business_id: number;
}


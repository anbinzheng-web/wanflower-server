import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Query, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles,
  UseGuards,
  HttpStatus,
  Request
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MediaManagementService } from '../services/media/media-management.service';
import { 
  MediaUploadDto, 
  MediaListDto, 
  MediaUpdateDto, 
  MediaDeleteDto,
  MediaBatchUploadDto 
} from '../dto/media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
import { ApiPaginatedResponse, ApiMessageResponse } from '../decorators/swagger.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/roles.enum';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaManagementService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传单个媒体文件' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  async uploadMedia(
    @UploadedFile() file: any,
    @Body() data: any,
    @Request() req: any
  ) {
    // 转换参数类型
    const uploadOptions = {
      file,
      businessType: data.business_type,
      businessId: data.business_id ? parseInt(data.business_id) : undefined,
      type: data.type,
      altText: data.alt_text,
      sortOrder: data.sort_order ? parseInt(data.sort_order) : 0,
      category: data.category || 'DEFAULT',
      userId: req.user.userId
    };
    
    return await this.mediaService.uploadMedia(uploadOptions);
  }

  @Post('batch-upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传媒体文件' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  async batchUploadMedia(
    @UploadedFiles() files: any[],
    @Body() data: any,
    @Request() req: any
  ) {
    // 转换参数类型
    const uploadOptions = {
      businessType: data.business_type,
      businessId: data.business_id ? parseInt(data.business_id) : undefined,
      type: data.type,
      category: data.category || 'DEFAULT',
      userId: req.user.userId
    };
    
    return await this.mediaService.batchUploadMedia(files, uploadOptions);
  }

  @Get('list')
  @ApiOperation({ summary: '获取媒体列表' })
  @ApiPaginatedResponse(MediaResponseDto)
  async getMediaList(
    @Query() query: any,
    @Request() req: any
  ) {
    // 转换参数类型
    const params: MediaListDto = {
      page: query.page ? parseInt(query.page) : 1,
      page_size: query.page_size ? parseInt(query.page_size) : 20,
      business_type: query.business_type,
      business_id: query.business_id ? parseInt(query.business_id) : undefined,
      type: query.type,
      category: query.category,
      user_id: query.user_id ? parseInt(query.user_id) : undefined
    };
    
    // 普通用户只能查看自己的媒体文件
    if (req.user.role === Role.User) {
      params.user_id = req.user.userId;
    }
    
    return this.mediaService.getMediaList(params);
  }

  @Put('update')
  @ApiOperation({ summary: '更新媒体信息' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限修改此文件' })
  async updateMedia(
    @Body() data: MediaUpdateDto,
    @Request() req: any
  ) {
    return this.mediaService.updateMedia(data.id, {
      alt_text: data.alt_text,
      sort_order: data.sort_order,
      category: data.category
    }, req.user.role === Role.User ? req.user.userId : undefined);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除媒体文件' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限删除此文件' })
  async deleteMedia(
    @Body() data: MediaDeleteDto,
    @Request() req: any
  ) {
    return this.mediaService.deleteMedia(data.id, req.user.role === Role.User ? req.user.userId : undefined);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取媒体分类列表' })
  @ApiMessageResponse()
  async getMediaCategories() {
    return {
      categories: [
        { value: 'DEFAULT', label: '默认' },
        { value: 'COVER', label: '封面图' },
        { value: 'GALLERY', label: '相册' },
        { value: 'DETAIL', label: '详情图' },
        { value: 'THUMBNAIL', label: '缩略图' },
        { value: 'AVATAR', label: '头像' },
        { value: 'BANNER', label: '横幅' },
        { value: 'ICON', label: '图标' }
      ]
    };
  }

  @Get('business-types')
  @ApiOperation({ summary: '获取业务类型列表' })
  @ApiMessageResponse()
  async getBusinessTypes() {
    return {
      business_types: [
        { value: 'PRODUCT', label: '产品' },
        { value: 'BLOG', label: '博客' },
        { value: 'REVIEW', label: '评论' },
        { value: 'USER', label: '用户' },
        { value: 'GENERAL', label: '通用' }
      ]
    };
  }
}

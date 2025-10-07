import { Body, Controller, Get, Post, Query, Param, Put, Delete, UseInterceptors, UploadedFile, UploadedFiles, UseGuards, HttpStatus, Request } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiResponse, ApiOperation, ApiParam, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { BlogMediaService } from './blog-media.service';
import { 
  BlogCreateDto, 
  BlogListDto, 
  BlogUpdateDto, 
  BlogSlugDto,
  BlogTagCreateDto,
  BlogTagUpdateDto,
  BlogTagListDto,
  BlogCategoryCreateDto,
  BlogCategoryUpdateDto,
  BlogCategoryListDto
} from './blog.dto';
import { ByIdDto } from 'shared/dto/byId.dto';
import { ApiPaginatedResponse, ApiMessageResponse } from 'shared/decorators/swagger.decorator';
import { BlogMediaResponseDto } from 'shared/dto/media-response.dto';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogMediaService: BlogMediaService
  ) {}

  // ================================
  // 博客文章相关接口
  // ================================

  @Get('list')
  @ApiOperation({ summary: '获取博客列表' })
  @ApiPaginatedResponse(BlogListDto)
  async list(@Query() query: BlogListDto) {
    return this.blogService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取博客详情' })
  @ApiParam({ name: 'id', description: '博客ID' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '博客不存在' })
  async findById(@Param('id') id: string) {
    return this.blogService.findById(+id);
  }

  @Post('slug')
  @ApiOperation({ summary: '根据slug获取博客详情' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '博客不存在' })
  async findBySlug(@Body() body: BlogSlugDto) {
    return this.blogService.findBySlug(body);
  }

  @Post('create')
  @ApiOperation({ summary: '创建博客文章' })
  @ApiMessageResponse()
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Body() body: BlogCreateDto) {
    return this.blogService.create(body);
  }

  @Put('update')
  @ApiOperation({ summary: '更新博客文章' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '博客不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async update(@Body() body: BlogUpdateDto) {
    return this.blogService.update(body);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除博客文章' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '博客不存在' })
  async delete(@Body() body: ByIdDto) {
    return this.blogService.delete(body.id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: '增加博客浏览量' })
  @ApiParam({ name: 'id', description: '博客ID' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '博客不存在' })
  async incrementViewCount(@Param('id') id: string) {
    return this.blogService.incrementViewCount(+id);
  }

  // ================================
  // 博客标签相关接口
  // ================================

  @Get('tags/list')
  @ApiOperation({ summary: '获取标签列表' })
  @ApiPaginatedResponse(BlogTagListDto)
  async listTags(@Query() query: BlogTagListDto) {
    return this.blogService.findTags(query);
  }

  @Post('tags/create')
  @ApiOperation({ summary: '创建标签' })
  @ApiMessageResponse()
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createTag(@Body() body: BlogTagCreateDto) {
    return this.blogService.createTag(body);
  }

  @Put('tags/update')
  @ApiOperation({ summary: '更新标签' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updateTag(@Body() body: BlogTagUpdateDto) {
    return this.blogService.updateTag(body);
  }

  @Delete('tags/delete')
  @ApiOperation({ summary: '删除标签' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '标签不存在' })
  async deleteTag(@Body() body: ByIdDto) {
    return this.blogService.deleteTag(body.id);
  }

  // ================================
  // 博客分类相关接口
  // ================================

  @Get('categories/list')
  @ApiOperation({ summary: '获取分类列表' })
  @ApiPaginatedResponse(BlogCategoryListDto)
  async listCategories(@Query() query: BlogCategoryListDto) {
    return this.blogService.findCategories(query);
  }

  @Post('categories/create')
  @ApiOperation({ summary: '创建分类' })
  @ApiMessageResponse()
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createCategory(@Body() body: BlogCategoryCreateDto) {
    return this.blogService.createCategory(body);
  }

  @Put('categories/update')
  @ApiOperation({ summary: '更新分类' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updateCategory(@Body() body: BlogCategoryUpdateDto) {
    return this.blogService.updateCategory(body);
  }

  @Delete('categories/delete')
  @ApiOperation({ summary: '删除分类' })
  @ApiMessageResponse()
  @ApiResponse({ status: 404, description: '分类不存在' })
  async deleteCategory(@Body() body: ByIdDto) {
    return this.blogService.deleteCategory(body.id);
  }

  // ================================
  // 博客媒体管理接口（需要权限验证）
  // ================================

  @Post('media/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传博客媒体文件', description: '支持图片和视频，需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async uploadBlogMedia(
    @UploadedFile() file: any,
    @Body() data: { blog_id: number; type: string; alt_text?: string; sort_order?: number; category?: string },
    @Request() req: any
  ) {
    return this.blogMediaService.uploadBlogMedia(file, {
      blog_id: data.blog_id,
      type: data.type as any,
      alt_text: data.alt_text,
      sort_order: data.sort_order,
      category: data.category
    }, req.user.userId);
  }

  @Post('media/batch-upload/:blogId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传博客媒体文件', description: '需要员工或管理员权限' })
  @ApiParam({ name: 'blogId', description: '博客ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async batchUploadBlogMedia(
    @UploadedFiles() files: any[],
    @Param('blogId') blogId: string,
    @Body() data: { type: string },
    @Request() req: any
  ) {
    return this.blogMediaService.batchUploadBlogMedia(files, +blogId, data.type as any, req.user.userId);
  }

  @Get('media/list/:blogId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取博客媒体列表', description: '需要员工或管理员权限' })
  @ApiParam({ name: 'blogId', description: '博客ID' })
  @ApiPaginatedResponse(BlogMediaResponseDto)
  async getBlogMediaList(
    @Param('blogId') blogId: string,
    @Query() query: { type?: string; category?: string; page?: number; page_size?: number }
  ) {
    return this.blogMediaService.getBlogMediaList(+blogId, {
      type: query.type as any,
      category: query.category,
      page: query.page,
      pageSize: query.page_size
    });
  }

  @Put('media/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新博客媒体信息', description: '需要员工或管理员权限' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作' })
  async updateBlogMedia(
    @Body() data: { id: number; alt_text?: string; sort_order?: number; category?: string },
    @Request() req: any
  ) {
    return this.blogMediaService.updateBlogMedia(data.id, {
      alt_text: data.alt_text,
      sort_order: data.sort_order,
      category: data.category
    }, req.user.userId);
  }

  @Delete('media/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除博客媒体文件', description: '需要员工或管理员权限' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作' })
  async deleteBlogMedia(
    @Body() data: { id: number },
    @Request() req: any
  ) {
    return this.blogMediaService.deleteBlogMedia(data.id, req.user.userId);
  }

  @Post('media/set-cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置博客封面图片', description: '需要员工或管理员权限' })
  @ApiMessageResponse()
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作' })
  async setBlogCoverImage(
    @Body() data: { blog_id: number; media_id: number },
    @Request() req: any
  ) {
    return this.blogMediaService.setBlogCoverImage(data.blog_id, data.media_id, req.user.userId);
  }

  // ================================
  // 管理接口（需要权限验证）
  // ================================

  @Get('admin/test')
  @ApiOperation({ summary: '博客模块健康检查' })
  @ApiMessageResponse()
  async adminTest() {
    return {
      message: '博客模块运行正常',
      timestamp: new Date().toISOString(),
      module: 'blog'
    };
  }
}
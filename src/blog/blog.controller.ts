import { Body, Controller, Get, Post, Query, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BlogService } from './blog.service';
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

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  // ================================
  // 博客文章相关接口
  // ================================

  @Get('list')
  @ApiOperation({ summary: '获取博客列表' })
  @ApiResponse({ status: 200, description: '获取博客列表成功' })
  async list(@Query() query: BlogListDto) {
    return this.blogService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取博客详情' })
  @ApiParam({ name: 'id', description: '博客ID' })
  @ApiResponse({ status: 200, description: '获取博客详情成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  async findById(@Param('id') id: string) {
    return this.blogService.findById(+id);
  }

  @Post('slug')
  @ApiOperation({ summary: '根据slug获取博客详情' })
  @ApiResponse({ status: 200, description: '获取博客详情成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  async findBySlug(@Body() body: BlogSlugDto) {
    return this.blogService.findBySlug(body);
  }

  @Post('create')
  @ApiOperation({ summary: '创建博客文章' })
  @ApiResponse({ status: 201, description: '创建博客文章成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Body() body: BlogCreateDto) {
    return this.blogService.create(body);
  }

  @Put('update')
  @ApiOperation({ summary: '更新博客文章' })
  @ApiResponse({ status: 200, description: '更新博客文章成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async update(@Body() body: BlogUpdateDto) {
    return this.blogService.update(body);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除博客文章' })
  @ApiResponse({ status: 200, description: '删除博客文章成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  async delete(@Body() body: ByIdDto) {
    return this.blogService.delete(body.id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: '增加博客浏览量' })
  @ApiParam({ name: 'id', description: '博客ID' })
  @ApiResponse({ status: 200, description: '增加浏览量成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  async incrementViewCount(@Param('id') id: string) {
    return this.blogService.incrementViewCount(+id);
  }

  // ================================
  // 博客标签相关接口
  // ================================

  @Get('tags/list')
  @ApiOperation({ summary: '获取标签列表' })
  @ApiResponse({ status: 200, description: '获取标签列表成功' })
  async listTags(@Query() query: BlogTagListDto) {
    return this.blogService.findTags(query);
  }

  @Post('tags/create')
  @ApiOperation({ summary: '创建标签' })
  @ApiResponse({ status: 201, description: '创建标签成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createTag(@Body() body: BlogTagCreateDto) {
    return this.blogService.createTag(body);
  }

  @Put('tags/update')
  @ApiOperation({ summary: '更新标签' })
  @ApiResponse({ status: 200, description: '更新标签成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updateTag(@Body() body: BlogTagUpdateDto) {
    return this.blogService.updateTag(body);
  }

  @Delete('tags/delete')
  @ApiOperation({ summary: '删除标签' })
  @ApiResponse({ status: 200, description: '删除标签成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async deleteTag(@Body() body: ByIdDto) {
    return this.blogService.deleteTag(body.id);
  }

  // ================================
  // 博客分类相关接口
  // ================================

  @Get('categories/list')
  @ApiOperation({ summary: '获取分类列表' })
  @ApiResponse({ status: 200, description: '获取分类列表成功' })
  async listCategories(@Query() query: BlogCategoryListDto) {
    return this.blogService.findCategories(query);
  }

  @Post('categories/create')
  @ApiOperation({ summary: '创建分类' })
  @ApiResponse({ status: 201, description: '创建分类成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createCategory(@Body() body: BlogCategoryCreateDto) {
    return this.blogService.createCategory(body);
  }

  @Put('categories/update')
  @ApiOperation({ summary: '更新分类' })
  @ApiResponse({ status: 200, description: '更新分类成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updateCategory(@Body() body: BlogCategoryUpdateDto) {
    return this.blogService.updateCategory(body);
  }

  @Delete('categories/delete')
  @ApiOperation({ summary: '删除分类' })
  @ApiResponse({ status: 200, description: '删除分类成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  async deleteCategory(@Body() body: ByIdDto) {
    return this.blogService.deleteCategory(body.id);
  }

  // ================================
  // 管理接口（需要权限验证）
  // ================================

  @Get('admin/test')
  @ApiOperation({ summary: '博客模块健康检查' })
  @ApiResponse({ status: 200, description: '博客模块运行正常' })
  async adminTest() {
    return {
      message: '博客模块运行正常',
      timestamp: new Date().toISOString(),
      module: 'blog'
    };
  }
}
import { 
  Controller, Get, Post, Put, Delete, Query, UseInterceptors, 
  UploadedFile, UploadedFiles, Body, Param, ParseIntPipe, 
  UseGuards, HttpStatus
} from "@nestjs/common";
import { 
  ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse,
  ApiBearerAuth, ApiParam
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { MediaType } from '@prisma/client';
import { ProductService } from '../services/product.server';
import { ProductMediaService } from '../services/product-media.service';
import { 
  ProductListDto, ProductDetailDto, ProductCreateDto, ProductUpdateDto,
  ProductViewDto, ProductBatchDeleteDto, ProductBatchUpdateStatusDto,
  ProductMediaUploadDto, ProductMediaUpdateDto, ProductMediaDeleteDto,
  CategoryListDto, CategoryCreateDto, CategoryUpdateDto,
  ProductAttributeCreateDto, ProductAttributeUpdateDto, ProductAttributeListDto, ProductAttributeDeleteDto,
  ProductMediaUploadOrderDto,
  ProductMediaBatchUploadOrderDto,
  CategoryItemDto
} from '../dtos';
import { ApiPaginatedResponse, ApiMessageResponse, ApiArrayResponse } from 'shared/decorators/swagger.decorator';

@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(
    private productService: ProductService,
    private productMediaService: ProductMediaService
  ) {}

  // ================================
  // 公开接口（无需权限）
  // ================================

  @Get('list')
  @ApiOperation({ summary: '获取产品列表', description: '支持筛选、排序、分页的产品列表' })
  @ApiPaginatedResponse(ProductListDto)
  async getProductList(@Query() query: ProductListDto) {
    return await this.productService.getProductList(query);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '获取产品详情' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiMessageResponse(ProductDetailDto)
  async getProductDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.getProductDetail({ id });
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: '通过SKU获取产品详情' })
  @ApiParam({ name: 'sku', description: '产品SKU' })
  @ApiMessageResponse(ProductDetailDto)
  @ApiResponse({ status: 404, description: '产品不存在' })
  async getProductBySku(@Param('sku') sku: string) {
    return await this.productService.getProductBySku(sku);
  }

  @Post('view')
  @ApiOperation({ summary: '增加产品浏览量' })
  @ApiMessageResponse(ProductViewDto)
  async incrementProductView(@Body() data: ProductViewDto) {
    return await this.productService.incrementProductView(data);
  }


  // ================================
  // 管理接口（需要员工或管理员权限）
  // ================================

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建产品', description: '需要员工或管理员权限' })
  @ApiMessageResponse(ProductCreateDto)
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async createProduct(@Body() data: ProductCreateDto) {
    return await this.productService.createProduct(data);
  }

  @Put('update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新产品', description: '需要员工或管理员权限' })
  @ApiMessageResponse(ProductUpdateDto)
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '产品不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async updateProduct(@Body() data: ProductUpdateDto) {
    return await this.productService.updateProduct(data);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除产品', description: '软删除，需要员工或管理员权限' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '产品不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.deleteProduct(id);
  }

  @Post('batch-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除产品', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async batchDeleteProducts(@Body() data: ProductBatchDeleteDto) {
    return await this.productService.batchDeleteProducts(data);
  }

  @Post('batch-update-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量更新产品状态', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async batchUpdateProductStatus(@Body() data: ProductBatchUpdateStatusDto) {
    return await this.productService.batchUpdateProductStatus(data);
  }

  // ================================
  // 媒体文件管理接口（需要员工或管理员权限）
  // ================================

  @Post('media/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传产品媒体文件', description: '使用统一媒体管理系统，支持图片和视频，需要员工或管理员权限' })
  @ApiBody({ type: ProductMediaUploadDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async uploadProductMedia(
    @UploadedFile() file: any,
    @Body() data: ProductMediaUploadOrderDto
  ) {
    return await this.productMediaService.uploadProductMedia(file, data);
  }

  @Post('media/batch-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10)) // 最多10个文件
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传产品媒体文件', description: '使用统一媒体管理系统，需要员工或管理员权限' })
  @ApiBody({ type: ProductMediaBatchUploadOrderDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async batchUploadProductMedia(
    @UploadedFiles() files: any[],
    @Body() data: ProductMediaUploadOrderDto
  ) {
    return await this.productMediaService.batchUploadProductMedia(files, data);
  }

  @Put('media/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新媒体文件信息', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async updateProductMedia(@Body() data: ProductMediaUpdateDto) {
    return await this.productMediaService.updateProductMedia(data);
  }

  @Delete('media/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除媒体文件', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async deleteProductMedia(@Body() data: ProductMediaDeleteDto) {
    return await this.productMediaService.deleteProductMedia(data);
  }

  @Get('media/list/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取产品媒体列表', description: '使用统一媒体管理系统，需要员工或管理员权限' })
  @ApiParam({ name: 'productId', description: '产品ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getProductMediaList(@Param('productId', ParseIntPipe) productId: number) {
    return await this.productMediaService.getProductMedia(productId);
  }

  @Get('media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个媒体文件信息', description: '使用统一媒体管理系统，需要员工或管理员权限' })
  @ApiParam({ name: 'mediaId', description: '媒体文件ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  async getProductMediaById(@Param('mediaId', ParseIntPipe) mediaId: number) {
    return await this.productMediaService.getProductMediaById(mediaId);
  }

  // @Post('media/set-main/:productId/:mediaId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.Staff, Role.Admin)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '设置产品主图', description: '使用统一媒体管理系统，需要员工或管理员权限' })
  // @ApiParam({ name: 'productId', description: '产品ID' })
  // @ApiParam({ name: 'mediaId', description: '媒体文件ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: '设置成功' })
  // async setProductMainImage(
  //   @Param('productId', ParseIntPipe) productId: number,
  //   @Param('mediaId', ParseIntPipe) mediaId: number
  // ) {
  //   return await this.productMediaService.setProductMainImage(productId, mediaId);
  // }

  @Get('media/stats/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取产品媒体统计', description: '使用统一媒体管理系统，需要员工或管理员权限' })
  @ApiParam({ name: 'productId', description: '产品ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getProductMediaStats(@Param('productId', ParseIntPipe) productId: number) {
    return await this.productMediaService.getProductMediaStats(productId);
  }

  // ================================
  // 产品分类管理接口
  // ================================

  @Get('category/list')
  @ApiOperation({ summary: '获取产品分类列表' })
  @ApiArrayResponse(CategoryItemDto)
  async getCategoryList(@Query() query: CategoryListDto) {
    return await this.productService.getCategoryList(query);
  }

  @Post('category/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建产品分类', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async createCategory(@Body() data: CategoryCreateDto) {
    return await this.productService.createCategory(data);
  }

  @Put('category/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新产品分类', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '分类不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async updateCategory(@Body() data: CategoryUpdateDto) {
    return await this.productService.updateCategory(data);
  }

  @Delete('category/delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除产品分类', description: '仅管理员权限，且分类下不能有产品或子分类' })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '分类下有产品或子分类，无法删除' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '分类不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.deleteCategory(id);
  }

  // ================================
  // 产品属性管理接口（需要权限）
  // ================================

  @Get('attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取产品属性列表', description: '需要员工或管理员权限' })
  @ApiMessageResponse(Object)
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '产品不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async getProductAttributes(@Query() query: ProductAttributeListDto) {
    return await this.productService.getProductAttributes(query.product_id);
  }

  @Post('attribute/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建产品属性', description: '需要员工或管理员权限' })
  @ApiMessageResponse(Object)
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '产品不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async createProductAttribute(@Body() data: ProductAttributeCreateDto) {
    return await this.productService.createProductAttribute(data);
  }

  @Put('attribute/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新产品属性', description: '需要员工或管理员权限' })
  @ApiMessageResponse(Object)
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '属性不存在或产品已删除' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async updateProductAttribute(@Body() data: ProductAttributeUpdateDto) {
    return await this.productService.updateProductAttribute(data);
  }

  @Delete('attribute/delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除产品属性', description: '需要员工或管理员权限' })
  @ApiParam({ name: 'id', description: '属性ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '属性不存在或产品已删除' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async deleteProductAttribute(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.deleteProductAttribute(id);
  }
}
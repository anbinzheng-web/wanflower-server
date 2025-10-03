import { 
  Controller, Get, Post, Put, Delete, Query, UseInterceptors, 
  UploadedFile, UploadedFiles, Body, Param, ParseIntPipe, 
  UseGuards, HttpStatus, Request, ValidationPipe, UsePipes
} from '@nestjs/common';
import { 
  ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { ReviewService } from './review.service';
import { ReviewMediaService } from './review-media.service';
import { 
  ReviewListDto, ReviewCreateDto, ReviewUpdateDto, ReviewDetailDto,
  ReviewHelpfulVoteDto, ReviewModerationDto, ReviewBatchModerationDto,
  AdminReviewListDto, ReviewDeleteDto, ReviewReportDto, ReviewStatsDto,
  ReviewMediaUploadDto, ReviewMediaDeleteDto, ReviewMediaUpdateDto
} from './review.dto';
import { MediaType } from '@prisma/client';

@ApiTags('review')
@Controller('review')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class ReviewController {
  constructor(
    private reviewService: ReviewService,
    private reviewMediaService: ReviewMediaService
  ) {}

  // ================================
  // 公开接口（无需权限）
  // ================================

  @Get('list')
  @ApiOperation({ summary: '获取产品评论列表', description: '公开接口，获取已审核通过的评论' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getReviewList(@Query() query: ReviewListDto) {
    return await this.reviewService.getReviewList(query);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '获取评论详情' })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '评论不存在' })
  async getReviewDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.reviewService.getReviewDetail({ id });
  }

  @Get('stats/:productId')
  @ApiOperation({ summary: '获取产品评论统计' })
  @ApiParam({ name: 'productId', description: '产品ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getReviewStats(@Param('productId', ParseIntPipe) product_id: number) {
    return await this.reviewService.getReviewStats({ product_id });
  }

  @Get('media/:reviewId')
  @ApiOperation({ summary: '获取评论媒体文件' })
  @ApiParam({ name: 'reviewId', description: '评论ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getReviewMedia(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return await this.reviewMediaService.getReviewMedia(reviewId);
  }

  // ================================
  // 用户接口（需要登录）
  // ================================

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建评论', description: '需要登录，且必须购买过该产品' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误或未购买产品' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未登录' })
  async createReview(@Body() data: ReviewCreateDto, @Request() req: any) {
    return await this.reviewService.createReview(data, req.user.id);
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新评论', description: '只能更新自己的评论，且只能更新待审核的评论' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '评论不存在或无权限' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '已审核通过的评论无法修改' })
  async updateReview(@Body() data: ReviewUpdateDto, @Request() req: any) {
    return await this.reviewService.updateReview(data, req.user.id);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论', description: '软删除，只能删除自己的评论' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '评论不存在或无权限' })
  async deleteReview(@Body() data: ReviewDeleteDto, @Request() req: any) {
    return await this.reviewService.deleteReview(data, req.user.id);
  }

  @Post('vote-helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '评论有用性投票', description: '对评论进行有用/无用投票' })
  @ApiResponse({ status: HttpStatus.OK, description: '投票成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '不能给自己的评论投票' })
  async voteReviewHelpful(@Body() data: ReviewHelpfulVoteDto, @Request() req: any) {
    return await this.reviewService.voteReviewHelpful(data, req.user.id);
  }

  @Post('report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '举报评论', description: '举报不当评论' })
  @ApiResponse({ status: HttpStatus.OK, description: '举报成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '不能举报自己的评论或已举报过' })
  async reportReview(@Body() data: ReviewReportDto, @Request() req: any) {
    return await this.reviewService.reportReview(data, req.user.id);
  }

  // ================================
  // 媒体文件管理接口（需要登录）
  // ================================

  @Post('media/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传评论媒体文件', description: '支持图片和视频，需要登录' })
  @ApiBody({ type: ReviewMediaUploadDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '文件格式或大小不符合要求' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作此评论' })
  async uploadReviewMedia(
    @UploadedFile() file: any,
    @Body() data: Omit<ReviewMediaUploadDto, 'file'>,
    @Request() req: any
  ) {
    return await this.reviewMediaService.uploadReviewMedia(file, data, req.user.id);
  }

  @Post('media/batch-upload/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 9)) // 最多9个文件
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传评论媒体文件', description: '需要登录' })
  @ApiParam({ name: 'reviewId', description: '评论ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '上传成功' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作此评论' })
  async batchUploadReviewMedia(
    @UploadedFiles() files: any[],
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body('type') type: MediaType = MediaType.IMAGE,
    @Request() req: any
  ) {
    return await this.reviewMediaService.batchUploadReviewMedia(files, reviewId, type, req.user.id);
  }

  @Put('media/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新媒体文件信息', description: '需要登录' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作此媒体文件' })
  async updateReviewMedia(@Body() data: ReviewMediaUpdateDto, @Request() req: any) {
    return await this.reviewMediaService.updateReviewMedia(data, req.user.id);
  }

  @Delete('media/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除媒体文件', description: '需要登录' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '无权限操作此媒体文件' })
  async deleteReviewMedia(@Body() data: ReviewMediaDeleteDto, @Request() req: any) {
    return await this.reviewMediaService.deleteReviewMedia(data, req.user.id);
  }

  @Get('my-media/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的评论媒体文件', description: '用于编辑时获取' })
  @ApiParam({ name: 'reviewId', description: '评论ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getMyReviewMedia(@Param('reviewId', ParseIntPipe) reviewId: number, @Request() req: any) {
    return await this.reviewMediaService.getReviewMedia(reviewId, req.user.id);
  }

  // ================================
  // 管理员接口（需要管理员权限）
  // ================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员获取评论列表', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async getAdminReviewList(@Query() query: AdminReviewListDto) {
    return await this.reviewService.getAdminReviewList(query);
  }

  @Post('admin/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核评论', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '审核成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '评论不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async moderateReview(@Body() data: ReviewModerationDto, @Request() req: any) {
    return await this.reviewService.moderateReview(data, req.user.id);
  }

  @Post('admin/batch-moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量审核评论', description: '需要员工或管理员权限' })
  @ApiResponse({ status: HttpStatus.OK, description: '批量审核成功' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async batchModerateReviews(@Body() data: ReviewBatchModerationDto, @Request() req: any) {
    return await this.reviewService.batchModerateReviews(data, req.user.id);
  }

  @Delete('admin/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员删除媒体文件', description: '仅管理员权限' })
  @ApiParam({ name: 'mediaId', description: '媒体文件ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '媒体文件不存在' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async adminDeleteReviewMedia(@Param('mediaId', ParseIntPipe) mediaId: number, @Request() req: any) {
    return await this.reviewMediaService.adminDeleteReviewMedia(mediaId, req.user.id);
  }
}
import { Controller, Get, Post, Query, UseInterceptors, UploadedFile, Body, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ProductListDto, ProductImageUploadDto, ProductUpdateDto, ProductCreateDto } from 'product/dtos';
import { PrismaService } from 'shared/services/prisma.service';
import {} from 'auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import Express from 'express';
import { UploadService } from "shared/services/upload/upload.service";
import { ByIdDto } from "shared/dto/byId.dto";

@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  @Get('list')
  async list(@Query() query: ProductListDto) {
    const [productList, productTotal] = await Promise.all([
      this.prisma.product.findMany({
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
        where: {},
        orderBy: {
          price: query.price_order
        }
      }),
      this.prisma.product.count({
        where: {}
      })
    ])
    return {
      records: productList,
      total: productTotal,
      page: query.page,
      page_size: query.page_size
    }
  }

  @Get('detail')
  async detail(@Body() body: ByIdDto) { 
    return this.prisma.product.findUnique({ where: { id: body.id } })
  }

  @Post('create')
  async create(@Body() body: ProductCreateDto) {
    await this.prisma.product.create({
      data: body
    })
  }

  @Post('update')
  async update(@Body() body: ProductUpdateDto) {
    await this.prisma.product.update({
      where: { id: body.id },
      data: body
    })
  }

  @Post('delete')
  async delete(@Body() body: ByIdDto) {
    await this.prisma.product.update({
      where: { id: body.id },
      data: { deleted_at: new Date() }
    })
  }

  @Post('upload_image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ProductImageUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() body: Omit<ProductImageUploadDto, 'file'>) {
    // TODO: 还需要存储到数据库中去。
    return this.uploadService.upload(file);
  }

  @Post('delete_image/:id')
  async deleteImage(@Param('id') id) {
    return this.prisma.productImage.delete({ where: { id: Number(id) } })
  }

  @Post('views')
  @ApiOperation({ description: '商品浏览量+1' })
  async views(@Body() body: ByIdDto) {
    // TODO：这里需要考虑并发问题，后续优化。（使用 Redis 技术，然后定时同步至数据库）
    const product = await this.prisma.product.findUnique({
      where: { id: body.id },
    })
    if (product) {
      product.view_count ++;
      await this.prisma.product.update({
        where: { id: body.id },
        data: { view_count: product.view_count }
      })
    }
  }
}
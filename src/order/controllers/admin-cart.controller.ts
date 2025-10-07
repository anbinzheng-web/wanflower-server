import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { CartService } from '../services/cart.service';
import { 
  AdminCartQueryDto, 
  AdminBatchCartOperationDto, 
  AdminCartStatisticsDto,
  AdminCartResponseDto
} from '../dtos/admin-cart.dto';
import { ApiPaginatedResponse, ApiMessageResponse } from 'shared/decorators/swagger.decorator';
import { PaginatedData } from 'shared/dto/response.dto';

@ApiTags('admin-cart')
@Controller('admin/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Staff)
@ApiBearerAuth()
export class AdminCartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '获取所有购物车列表（管理员）' })
  @ApiPaginatedResponse(AdminCartResponseDto)
  async getAllCarts(@Query() query: AdminCartQueryDto): Promise<PaginatedData<any>> {
    return await this.cartService.getAllCarts(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取购物车统计信息（管理员）' })
  @ApiMessageResponse(AdminCartStatisticsDto)
  async getCartStatistics(): Promise<AdminCartStatisticsDto> {
    return await this.cartService.getCartStatistics();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取指定用户的购物车（管理员）' })
  @ApiMessageResponse(AdminCartResponseDto)
  async getCartByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.cartService.getCartByUserId(userId);
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: '删除指定用户的购物车（管理员）' })
  @ApiMessageResponse()
  async deleteCartByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.cartService.deleteCartByUserId(userId);
  }

  @Post('batch-operation')
  @ApiOperation({ summary: '批量操作购物车项（管理员）' })
  @ApiMessageResponse()
  async batchOperationCartItems(@Body() operationDto: AdminBatchCartOperationDto) {
    return await this.cartService.batchOperationCartItems(operationDto);
  }

  @Delete('clear-all')
  @ApiOperation({ summary: '清空所有购物车（管理员）' })
  @ApiMessageResponse()
  async clearAllCarts() {
    return await this.cartService.clearAllCarts();
  }
}

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto, OrderWithDetailsDto, OrderStatsDto, ConfirmPaymentDto } from '../dtos';
import { ApiPaginatedResponse, ApiMessageResponse } from 'shared/decorators/swagger.decorator';
import { OrderWithDetails, OrderStats } from '../interfaces/order.interface';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  @ApiMessageResponse(OrderWithDetailsDto)
  async createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    // 确定订单的用户ID
    let targetUserId: number;
    
    if (createOrderDto.user_id) {
      // 如果提供了user_id，检查权限
      if (userRole !== Role.Admin && userRole !== Role.Staff) {
        throw new BadRequestException('只有管理员和员工可以代用户下单');
      }
      targetUserId = createOrderDto.user_id;
    } else {
      // 如果没有提供user_id，使用当前用户ID
      targetUserId = currentUserId;
    }
    
    // 创建订单时使用目标用户ID
    return await this.orderService.createOrder(targetUserId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  @ApiPaginatedResponse(OrderWithDetailsDto)
  async getOrders(@Request() req: any, @Query() query: OrderQueryDto) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 普通用户只能查看自己的订单，管理员可以查看所有订单
    if (userRole === Role.User) {
      query.user_id = userId;
    }
    
    return await this.orderService.getOrders(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取订单统计' })
  @ApiMessageResponse(OrderStatsDto)
  async getOrderStats(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 普通用户只能查看自己的统计，管理员可以查看所有统计
    return await this.orderService.getOrderStats(userRole === Role.Admin ? undefined : userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiMessageResponse(OrderWithDetailsDto)
  async getOrderById(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 普通用户只能查看自己的订单，管理员可以查看所有订单
    return await this.orderService.getOrderById(id, userRole === Role.Admin ? undefined : userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新订单' })
  @ApiMessageResponse(OrderWithDetailsDto)
  async updateOrder(
    @Request() req: any, 
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 普通用户只能更新自己的订单，管理员可以更新所有订单
    return await this.orderService.updateOrder(id, updateOrderDto, userRole === Role.Admin ? undefined : userId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: '取消订单' })
  @ApiMessageResponse(OrderWithDetailsDto)
  async cancelOrder(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    return await this.orderService.cancelOrder(id, userId);
  }

  @Put(':id/confirm-payment')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Staff)
  @ApiOperation({ summary: '确认线下支付（仅管理员/员工）' })
  @ApiMessageResponse(OrderWithDetailsDto)
  async confirmOfflinePayment(
    @Request() req: any, 
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentData: ConfirmPaymentDto
  ) {
    const adminId = req.user.userId;
    return await this.orderService.confirmOfflinePayment(id, paymentData, adminId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: '删除订单（仅管理员）' })
  @ApiMessageResponse()
  async deleteOrder(@Param('id', ParseIntPipe) id: number) {
    await this.orderService.deleteOrder(id);
    return { message: '订单删除成功' };
  }
}

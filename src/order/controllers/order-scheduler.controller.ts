import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { SchedulerService } from 'shared/services/scheduler.service';
import { OrderService } from '../services/order.service';

@ApiTags('订单调度管理')
@Controller('orders/scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderSchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * 手动触发超时订单检查
   */
  @Post('check-timeout')
  @Roles(Role.Admin, Role.Staff)
  @ApiOperation({ summary: '手动触发超时订单检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async checkTimeoutOrders() {
    await this.schedulerService.triggerOrderTimeoutCheck();
    return { message: '超时订单检查已触发' };
  }

  /**
   * 获取订单支付状态信息
   */
  @Get('payment-status/:id')
  @ApiOperation({ summary: '获取订单支付状态信息' })
  @ApiResponse({ status: 200, description: '支付状态信息' })
  async getOrderPaymentStatus(id: number) {
    const order = await this.orderService.getOrderById(id);
    
    const now = new Date();
    const isExpired = order.payment_deadline ? order.payment_deadline < now : false;
    const remainingTime = order.payment_deadline 
      ? Math.max(0, Math.floor((order.payment_deadline.getTime() - now.getTime()) / 1000))
      : 0;

    return {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_deadline: order.payment_deadline,
      is_expired: isExpired,
      remaining_seconds: remainingTime,
      remaining_minutes: Math.floor(remainingTime / 60),
      remaining_hours: Math.floor(remainingTime / 3600),
    };
  }
}

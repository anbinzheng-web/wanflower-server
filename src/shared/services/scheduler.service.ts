import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 每分钟检查一次超时订单
   * 取消超过30分钟未支付的订单并释放库存
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleOrderTimeout() {
    this.logger.log('开始检查超时订单...');

    try {
      // 查找所有超时的待付款订单
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          payment_status: PaymentStatus.PENDING,
          payment_deadline: {
            lt: new Date() // 支付截止时间小于当前时间
          }
        },
        include: {
          items: true
        }
      });

      if (expiredOrders.length === 0) {
        this.logger.log('没有发现超时订单');
        return;
      }

      this.logger.log(`发现 ${expiredOrders.length} 个超时订单，开始处理...`);

      // 批量处理超时订单
      for (const order of expiredOrders) {
        await this.cancelExpiredOrder(order);
      }

      this.logger.log(`成功处理 ${expiredOrders.length} 个超时订单`);
    } catch (error) {
      this.logger.error('处理超时订单时发生错误:', error);
    }
  }

  /**
   * 取消超时订单并释放库存
   */
  private async cancelExpiredOrder(order: any) {
    const transaction = await this.prisma.$transaction(async (tx) => {
      // 恢复商品库存
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // 更新订单状态为已取消
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          payment_status: PaymentStatus.CANCELLED,
          admin_notes: order.admin_notes 
            ? `${order.admin_notes}\n[${new Date().toISOString()}] 系统自动取消：订单超时未支付`
            : `[${new Date().toISOString()}] 系统自动取消：订单超时未支付`
        }
      });

      return updatedOrder;
    });

    this.logger.log(`订单 ${order.order_number} 已自动取消并释放库存`);
    return transaction;
  }

  /**
   * 手动触发超时订单检查（用于测试）
   */
  async triggerOrderTimeoutCheck() {
    this.logger.log('手动触发超时订单检查...');
    await this.handleOrderTimeout();
  }
}

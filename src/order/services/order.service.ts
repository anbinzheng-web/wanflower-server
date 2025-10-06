import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { 
  CreateOrderData, 
  UpdateOrderData, 
  OrderQueryParams, 
  OrderWithDetails,
  OrderStats 
} from '../interfaces/order.interface';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import { OrderQueryDto } from '../dtos/order-query.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成订单号
   * 格式: ORD + YYYYMMDD + 6位随机数
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ORD${year}${month}${day}${random}`;
  }

  /**
   * 计算订单金额
   */
  private async calculateOrderAmount(items: { product_id: number; quantity: number }[]) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map(item => item.product_id) },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        price: true,
        stock: true,
        name: true
      }
    });

    if (products.length !== items.length) {
      throw new BadRequestException('部分商品不存在或已下架');
    }

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      
      if (!product) {
        throw new BadRequestException(`商品不存在`);
      }
      
      if (product.stock < item.quantity) {
        throw new BadRequestException(`商品 ${product.name} 库存不足`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        product_snapshot: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          // TODO: 添加更多商品快照信息
        }
      });
    }

    // TODO: 计算运费、税费、折扣等
    const shipping_fee = 0;
    const tax_amount = 0;
    const discount_amount = 0;
    const total_amount = subtotal + shipping_fee + tax_amount - discount_amount;

    return {
      subtotal,
      shipping_fee,
      tax_amount,
      discount_amount,
      total_amount,
      orderItems
    };
  }

  /**
   * 创建订单
   */
  async createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<OrderWithDetails> {
    const { shipping_address, items, customer_notes, payment_method, shipping_method } = createOrderDto;

    // 计算订单金额
    const { subtotal, shipping_fee, tax_amount, discount_amount, total_amount, orderItems } = 
      await this.calculateOrderAmount(items);

    // 生成订单号
    const order_number = this.generateOrderNumber();

    // 计算支付截止时间（30分钟后）
    const payment_deadline = new Date(Date.now() + 30 * 60 * 1000);

    // 创建订单
    const order = await this.prisma.order.create({
      data: {
        order_number,
        user_id: userId,
        status: OrderStatus.PENDING,
        subtotal,
        shipping_fee,
        tax_amount,
        discount_amount,
        total_amount,
        shipping_address: shipping_address as any,
        payment_method,
        shipping_method,
        customer_notes,
        payment_status: PaymentStatus.PENDING,
        payment_deadline,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        }
      }
    });

    // 更新商品库存
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.product_id },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return order as any;
  }

  /**
   * 获取订单列表
   */
  async getOrders(query: OrderQueryDto): Promise<{ records: OrderWithDetails[]; total: number; page: number; page_size: number; total_pages: number }> {
    const {
      user_id,
      status,
      payment_status,
      order_number,
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query;

    const where: any = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (status) {
      where.status = status;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (order_number) {
      where.order_number = {
        contains: order_number
      };
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at.gte = new Date(start_date);
      }
      if (end_date) {
        where.created_at.lte = new Date(end_date);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  status: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
              phone: true
            }
          }
        },
        orderBy: {
          [sort_by]: sort_order
        },
        skip: (page - 1) * page_size,
        take: page_size
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      records: orders as any[],
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderById(id: number, userId?: number): Promise<OrderWithDetails> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 如果指定了用户ID，检查权限
    if (userId && order.user_id !== userId) {
      throw new ForbiddenException('无权访问此订单');
    }

    return order as any;
  }

  /**
   * 更新订单
   */
  async updateOrder(id: number, updateOrderDto: UpdateOrderDto, userId?: number): Promise<OrderWithDetails> {
    // 检查订单是否存在
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException('订单不存在');
    }

    // 如果指定了用户ID，检查权限
    if (userId && existingOrder.user_id !== userId) {
      throw new ForbiddenException('无权修改此订单');
    }

    // 处理日期字段
    const updateData: any = { ...updateOrderDto };
    if (updateOrderDto.paid_at) {
      updateData.paid_at = new Date(updateOrderDto.paid_at);
    }
    if (updateOrderDto.shipped_at) {
      updateData.shipped_at = new Date(updateOrderDto.shipped_at);
    }
    if (updateOrderDto.delivered_at) {
      updateData.delivered_at = new Date(updateOrderDto.delivered_at);
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        }
      }
    });

    return order as any;
  }

  /**
   * 取消订单
   */
  async cancelOrder(id: number, userId: number): Promise<OrderWithDetails> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('无权取消此订单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只能取消待付款的订单');
    }

    // 恢复商品库存
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.product_id },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    // 更新订单状态
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        }
      }
    });

    return updatedOrder as any;
  }

  /**
   * 获取订单统计
   */
  async getOrderStats(userId?: number): Promise<OrderStats> {
    const where = userId ? { user_id: userId } : {};

    const [
      total_orders,
      total_amount_result,
      pending_orders,
      paid_orders,
      shipped_orders,
      completed_orders,
      cancelled_orders,
      refunded_orders
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { total_amount: true }
      }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.REFUNDED } })
    ]);

    return {
      total_orders,
      total_amount: Number(total_amount_result._sum.total_amount || 0),
      pending_orders,
      paid_orders,
      shipped_orders,
      completed_orders,
      cancelled_orders,
      refunded_orders
    };
  }

  /**
   * 删除订单（软删除，仅管理员）
   */
  async deleteOrder(id: number): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // TODO: 实现软删除逻辑
    await this.prisma.order.delete({
      where: { id }
    });
  }

  /**
   * 确认线下支付
   */
  async confirmOfflinePayment(
    orderId: number, 
    paymentData: any, 
    adminId: number
  ): Promise<OrderWithDetails> {
    const { 
      payment_method, 
      amount, 
      payment_id, 
      paid_at, 
      payment_notes, 
      transaction_reference,
      bank_name,
      account_last_four
    } = paymentData;

    // 获取订单信息
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单状态
    if (order.status !== 'PENDING') {
      throw new BadRequestException('只有待付款的订单才能确认支付');
    }

    if (order.payment_status !== 'PENDING') {
      throw new BadRequestException('订单已经支付，无需重复确认');
    }

    // 验证支付金额
    if (Math.abs(amount - Number(order.total_amount)) > 0.01) {
      throw new BadRequestException(`支付金额 ${amount} 与订单金额 ${order.total_amount} 不匹配`);
    }

    // 更新订单状态
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        payment_status: 'PAID',
        payment_method: payment_method,
        payment_id: payment_id,
        paid_at: new Date(paid_at),
        admin_notes: order.admin_notes 
          ? `${order.admin_notes}\n[${new Date().toISOString()}] 管理员确认线下支付：${payment_method}，金额：${amount}${payment_notes ? `，备注：${payment_notes}` : ''}`
          : `[${new Date().toISOString()}] 管理员确认线下支付：${payment_method}，金额：${amount}${payment_notes ? `，备注：${payment_notes}` : ''}`
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    const adminIdNumber = Number(adminId);
    
    // 使用原始 SQL 创建支付日志记录
    await this.prisma.$executeRaw`
      INSERT INTO "PaymentLog" (order_id, payment_method, amount, payment_id, paid_at, payment_notes, transaction_reference, bank_name, account_last_four, admin_id, created_at)
      VALUES (${orderId}, ${payment_method}::"PaymentMethod", ${amount}, ${payment_id || null}, ${new Date(paid_at)}, ${payment_notes || null}, ${transaction_reference || null}, ${bank_name || null}, ${account_last_four || null}, ${adminIdNumber}, ${new Date()})
    `;

    return updatedOrder as any;
  }
}

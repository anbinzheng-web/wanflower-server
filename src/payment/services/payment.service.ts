import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { PaymentQueryDto, PaymentLogDto, PaymentDetailDto, PaymentStatsDto, PaymentMethod, PaymentStatus } from '../dtos';
import { PaginatedData } from 'shared/dto/response.dto';

// 使用更简单的类型定义
interface PaymentWithOrder {
  id: number;
  order_id: number;
  payment_method: string;
  amount: any;
  payment_id: string | null;
  paid_at: Date;
  payment_notes: string | null;
  transaction_reference: string | null;
  bank_name: string | null;
  account_last_four: string | null;
  admin_id: number;
  created_at: Date;
  order: {
    id: number;
    order_number: string;
    status: string;
    total_amount: any;
    payment_status: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
  };
}

interface PaymentWithOrderAndAdmin extends PaymentWithOrder {
  admin: {
    id: number;
    username: string;
    email: string;
  };
}

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取支付记录列表
   */
  async getPaymentList(query: PaymentQueryDto): Promise<PaginatedData<PaymentLogDto>> {
    const {
      page = 1,
      page_size = 10,
      search,
      payment_method,
      payment_status,
      start_date,
      end_date,
      min_amount,
      max_amount,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query;

    const skip = (page - 1) * page_size;

    // 构建查询条件
    const where: any = {};

    // 搜索条件
    if (search) {
      where.OR = [
        { payment_id: { contains: search } },
        { transaction_reference: { contains: search } },
        { order: { order_number: { contains: search } } },
        { order: { user: { email: { contains: search } } } }
      ];
    }

    // 支付方式筛选
    if (payment_method) {
      where.payment_method = payment_method;
    }

    // 支付状态筛选（通过订单状态）
    if (payment_status) {
      where.order = {
        ...where.order,
        payment_status: payment_status
      };
    }

    // 日期范围筛选
    if (start_date || end_date) {
      where.paid_at = {};
      if (start_date) {
        where.paid_at.gte = new Date(start_date);
      }
      if (end_date) {
        where.paid_at.lte = new Date(end_date + 'T23:59:59.999Z');
      }
    }

    // 金额范围筛选
    if (min_amount !== undefined || max_amount !== undefined) {
      where.amount = {};
      if (min_amount !== undefined) {
        where.amount.gte = min_amount;
      }
      if (max_amount !== undefined) {
        where.amount.lte = max_amount;
      }
    }

    // 排序条件
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // 查询数据
    const [payments, total] = await Promise.all([
      this.prisma.paymentLog.findMany({
        where,
        skip,
        take: page_size,
        orderBy,
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
              status: true,
              total_amount: true,
              payment_status: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          }
        }
      }) as unknown as PaymentWithOrder[],
      this.prisma.paymentLog.count({ where })
    ]);

    // 转换数据格式
    const records: PaymentLogDto[] = payments.map(payment => ({
      id: payment.id,
      order_id: payment.order_id,
      payment_method: payment.payment_method as PaymentMethod,
      amount: Number(payment.amount),
      payment_id: payment.payment_id || undefined,
      paid_at: payment.paid_at,
      payment_notes: payment.payment_notes || undefined,
      transaction_reference: payment.transaction_reference || undefined,
      bank_name: payment.bank_name || undefined,
      account_last_four: payment.account_last_four || undefined,
      admin_id: payment.admin_id,
      created_at: payment.created_at
    }));

    return {
      records,
      total,
      page,
      page_size
    };
  }

  /**
   * 获取支付详情
   */
  async getPaymentDetail(id: number): Promise<PaymentDetailDto> {
    const payment = await this.prisma.paymentLog.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            total_amount: true,
            payment_status: true,
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    }) as unknown as PaymentWithOrderAndAdmin | null;

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    return {
      id: payment.id,
      order_id: payment.order_id,
      payment_method: payment.payment_method as PaymentMethod,
      amount: Number(payment.amount),
      payment_id: payment.payment_id || undefined,
      paid_at: payment.paid_at,
      payment_notes: payment.payment_notes || undefined,
      transaction_reference: payment.transaction_reference || undefined,
      bank_name: payment.bank_name || undefined,
      account_last_four: payment.account_last_four || undefined,
      admin_id: payment.admin_id,
      created_at: payment.created_at,
      order: {
        id: payment.order.id,
        order_number: payment.order.order_number,
        status: payment.order.status,
        total_amount: Number(payment.order.total_amount),
        user: payment.order.user
      },
      admin: payment.admin
    };
  }

  /**
   * 获取支付统计
   */
  async getPaymentStats(): Promise<PaymentStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 总统计
    const totalStats = await this.prisma.paymentLog.aggregate({
      _count: { id: true },
      _sum: { amount: true }
    });

    // 今日统计
    const todayStats = await this.prisma.paymentLog.aggregate({
      where: {
        paid_at: { gte: todayStart }
      },
      _count: { id: true },
      _sum: { amount: true }
    });

    // 本月统计
    const monthStats = await this.prisma.paymentLog.aggregate({
      where: {
        paid_at: { gte: monthStart }
      },
      _count: { id: true },
      _sum: { amount: true }
    });

    // 按支付方式统计
    const byPaymentMethod = await this.prisma.paymentLog.groupBy({
      by: ['payment_method'],
      _count: { id: true },
      _sum: { amount: true }
    });

    // 按支付状态统计（通过订单状态）
    const byPaymentStatus = await this.prisma.order.groupBy({
      by: ['payment_status'],
      where: {
        payment_status: { not: 'PENDING' }
      },
      _count: { id: true },
      _sum: { total_amount: true }
    });

    // 构建按支付方式的统计结果
    const paymentMethodStats: any = {};
    Object.values(PaymentMethod).forEach(method => {
      paymentMethodStats[method] = { count: 0, amount: 0 };
    });
    byPaymentMethod.forEach(item => {
      paymentMethodStats[item.payment_method] = {
        count: item._count.id,
        amount: Number(item._sum.amount || 0)
      };
    });

    // 构建按支付状态的统计结果
    const paymentStatusStats: any = {};
    Object.values(PaymentStatus).forEach(status => {
      paymentStatusStats[status] = { count: 0, amount: 0 };
    });
    byPaymentStatus.forEach(item => {
      paymentStatusStats[item.payment_status] = {
        count: item._count.id,
        amount: Number(item._sum.total_amount || 0)
      };
    });

    return {
      total_payments: totalStats._count.id,
      total_amount: Number(totalStats._sum.amount || 0),
      today_payments: todayStats._count.id,
      today_amount: Number(todayStats._sum.amount || 0),
      month_payments: monthStats._count.id,
      month_amount: Number(monthStats._sum.amount || 0),
      by_payment_method: paymentMethodStats,
      by_payment_status: paymentStatusStats
    };
  }

  /**
   * 删除支付记录（仅管理员）
   */
  async deletePayment(id: number): Promise<void> {
    const payment = await this.prisma.paymentLog.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    // 检查是否有关联的订单
    const order = await this.prisma.order.findUnique({
      where: { id: payment.order_id },
      select: { payment_status: true }
    });

    if (order && order.payment_status === 'PAID') {
      throw new BadRequestException('无法删除已支付订单的支付记录');
    }

    await this.prisma.paymentLog.delete({
      where: { id }
    });
  }
}

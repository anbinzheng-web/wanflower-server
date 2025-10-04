import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from '../logger/logger.service';

/**
 * 用户活跃度统计服务
 * 负责统计和分析用户活跃度数据
 */
@Injectable()
export class UserActivityService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  /**
   * 获取今日活跃用户数
   * @returns 今日活跃用户数
   */
  async getTodayActiveUsers(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const count = await this.prisma.user.count({
        where: {
          last_login: {
            gte: today,
          },
        },
      });

      this.logger.info('获取今日活跃用户数', { count, date: today }, {
        module: 'UserActivityService',
        action: 'getTodayActiveUsers',
      });

      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取本周活跃用户数
   * @returns 本周活跃用户数
   */
  async getWeeklyActiveUsers(): Promise<number> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const count = await this.prisma.user.count({
        where: {
          last_login: {
            gte: startOfWeek,
          },
        },
      });

      this.logger.info('获取本周活跃用户数', { count, startDate: startOfWeek }, {
        module: 'UserActivityService',
        action: 'getWeeklyActiveUsers',
      });

      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取本月活跃用户数
   * @returns 本月活跃用户数
   */
  async getMonthlyActiveUsers(): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const count = await this.prisma.user.count({
        where: {
          last_login: {
            gte: startOfMonth,
          },
        },
      });

      this.logger.info('获取本月活跃用户数', { count, startDate: startOfMonth }, {
        module: 'UserActivityService',
        action: 'getMonthlyActiveUsers',
      });

      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户活跃度统计概览
   * @returns 活跃度统计数据
   */
  async getActivityStats() {
    try {
      const [today, weekly, monthly, total] = await Promise.all([
        this.getTodayActiveUsers(),
        this.getWeeklyActiveUsers(),
        this.getMonthlyActiveUsers(),
        this.getTotalUsers(),
      ]);

      const stats = {
        daily_active_users: today,
        weekly_active_users: weekly,
        monthly_active_users: monthly,
        total_users: total,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD格式
      };

      this.logger.info('获取用户活跃度统计', stats, {
        module: 'UserActivityService',
        action: 'getActivityStats',
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取总用户数
   * @returns 总用户数
   */
  async getTotalUsers(): Promise<number> {
    try {
      const count = await this.prisma.user.count();
      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取最近N天的活跃用户趋势
   * @param days 天数，默认7天
   * @returns 每日活跃用户数趋势
   */
  async getActiveUsersTrend(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // 生成日期范围
      const dateRange: Date[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dateRange.push(date);
      }

      // 查询每日活跃用户数
      const trends = await Promise.all(
        dateRange.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const count = await this.prisma.user.count({
            where: {
              last_login: {
                gte: date,
                lt: nextDay,
              },
            },
          });

          return {
            date: date.toISOString().split('T')[0],
            active_users: count,
          };
        })
      );

      this.logger.info('获取活跃用户趋势', { days, trends }, {
        module: 'UserActivityService',
        action: 'getActiveUsersTrend',
      });

      return trends;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取不活跃用户（超过指定天数未登录）
   * @param days 天数，默认30天
   * @returns 不活跃用户列表
   */
  async getInactiveUsers(days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const inactiveUsers = await this.prisma.user.findMany({
        where: {
          last_login: {
            lt: cutoffDate,
          },
          is_active: true, // 只查询活跃账户
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          last_login: true,
          created_at: true,
        },
        orderBy: {
          last_login: 'asc',
        },
      });

      this.logger.info('获取不活跃用户', { 
        days, 
        count: inactiveUsers.length,
        cutoffDate 
      }, {
        module: 'UserActivityService',
        action: 'getInactiveUsers',
      });

      return inactiveUsers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户活跃度分布
   * @returns 活跃度分布数据
   */
  async getActivityDistribution() {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const [todayActive, yesterdayActive, weekActive, monthActive, neverActive] = await Promise.all([
        this.prisma.user.count({
          where: { last_login: { gte: today } },
        }),
        this.prisma.user.count({
          where: { 
            last_login: { 
              gte: yesterday,
              lt: today,
            } 
          },
        }),
        this.prisma.user.count({
          where: { 
            last_login: { 
              gte: weekAgo,
              lt: yesterday,
            } 
          },
        }),
        this.prisma.user.count({
          where: { 
            last_login: { 
              gte: monthAgo,
              lt: weekAgo,
            } 
          },
        }),
        this.prisma.user.count({
          where: { 
            last_login: { 
              lt: monthAgo,
            } 
          },
        }),
      ]);

      const distribution = {
        today: todayActive,
        yesterday: yesterdayActive,
        this_week: weekActive,
        this_month: monthActive,
        inactive: neverActive,
        total: todayActive + yesterdayActive + weekActive + monthActive + neverActive,
      };

      this.logger.info('获取用户活跃度分布', distribution, {
        module: 'UserActivityService',
        action: 'getActivityDistribution',
      });

      return distribution;
    } catch (error) {
      throw error;
    }
  }
}

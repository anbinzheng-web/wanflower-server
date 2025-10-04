import { Controller, Get, Query } from '@nestjs/common';
import { UserActivityService } from 'shared/services/user-activity.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('user-activity')
@Controller('user-activity')
export class UserActivityController {
  constructor(private userActivityService: UserActivityService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取用户活跃度统计概览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivityStats() {
    return await this.userActivityService.getActivityStats();
  }

  @Get('today')
  @ApiOperation({ summary: '获取今日活跃用户数' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTodayActiveUsers() {
    const count = await this.userActivityService.getTodayActiveUsers();
    return { 
      daily_active_users: count,
      date: new Date().toISOString().split('T')[0],
    };
  }

  @Get('weekly')
  @ApiOperation({ summary: '获取本周活跃用户数' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWeeklyActiveUsers() {
    const count = await this.userActivityService.getWeeklyActiveUsers();
    return { 
      weekly_active_users: count,
      week_start: this.getWeekStart().toISOString().split('T')[0],
    };
  }

  @Get('monthly')
  @ApiOperation({ summary: '获取本月活跃用户数' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMonthlyActiveUsers() {
    const count = await this.userActivityService.getMonthlyActiveUsers();
    return { 
      monthly_active_users: count,
      month_start: this.getMonthStart().toISOString().split('T')[0],
    };
  }

  @Get('trend')
  @ApiOperation({ summary: '获取活跃用户趋势' })
  @ApiQuery({ name: 'days', required: false, description: '天数，默认7天' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActiveUsersTrend(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return await this.userActivityService.getActiveUsersTrend(dayCount);
  }

  @Get('inactive')
  @ApiOperation({ summary: '获取不活跃用户列表' })
  @ApiQuery({ name: 'days', required: false, description: '不活跃天数，默认30天' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInactiveUsers(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 30;
    return await this.userActivityService.getInactiveUsers(dayCount);
  }

  @Get('distribution')
  @ApiOperation({ summary: '获取用户活跃度分布' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivityDistribution() {
    return await this.userActivityService.getActivityDistribution();
  }

  private getWeekStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getMonthStart(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}

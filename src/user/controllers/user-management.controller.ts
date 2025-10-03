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
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { 
  GetUsersQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  ResetUserPasswordDto,
  UserResponseDto,
  UserListResponseDto
} from '../dto/user-management.dto';
import { Role } from '@prisma/client';

/**
 * 用户管理控制器
 * 提供用户管理的增删查改功能，仅限管理员和员工使用
 */
@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserManagementController {
  constructor(private userService: UserService) {}

  /**
   * 获取用户列表
   */
  @Get()
  @Roles('admin' as any, 'staff' as any)
  @ApiOperation({ summary: '获取用户列表', description: '支持分页、筛选、搜索功能' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserListResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<UserListResponseDto> {
    const result = await this.userService.getUsers(query);
    return {
      ...result,
      records: result.records.map(user => ({
        ...user,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        phone: user.phone || undefined,
        avatar_url: user.avatar_url || undefined,
        last_login: user.last_login || undefined,
      }))
    };
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  @Roles('admin' as any, 'staff' as any)
  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.userService.getUserById(id);
    return {
      ...user,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      phone: user.phone || undefined,
      avatar_url: user.avatar_url || undefined,
      last_login: user.last_login || undefined,
    };
  }

  /**
   * 创建用户
   */
  @Post()
  @Roles('admin' as any)
  @ApiOperation({ summary: '创建用户', description: '仅管理员可创建用户' })
  @ApiResponse({ status: 201, description: '创建成功', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createUserByAdmin(createUserDto);
    return {
      ...user,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      phone: user.phone || undefined,
      avatar_url: user.avatar_url || undefined,
      last_login: user.last_login || undefined,
    };
  }

  /**
   * 更新用户信息
   */
  @Put(':id')
  @Roles('admin' as any)
  @ApiOperation({ summary: '更新用户信息', description: '仅管理员可更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUserByAdmin(id, updateUserDto);
    return {
      ...user,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      phone: user.phone || undefined,
      avatar_url: user.avatar_url || undefined,
      last_login: user.last_login || undefined,
    };
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @Roles('admin' as any)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户', description: '仅管理员可删除用户' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.deleteUserByAdmin(id);
  }

  /**
   * 更新用户状态（激活/禁用）
   */
  @Put(':id/status')
  @Roles('admin' as any)
  @ApiOperation({ summary: '更新用户状态', description: '激活或禁用用户账户' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto
  ): Promise<{ message: string; user: any }> {
    const user = await this.userService.updateUserStatus(id, updateStatusDto.is_active);
    return {
      message: `用户已${updateStatusDto.is_active ? '激活' : '禁用'}`,
      user,
    };
  }

  /**
   * 更新用户角色
   */
  @Put(':id/role')
  @Roles('admin' as any)
  @ApiOperation({ summary: '更新用户角色', description: '修改用户角色权限' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateUserRoleDto
  ): Promise<{ message: string; user: any }> {
    const user = await this.userService.setRole(id, updateRoleDto.role as any);
    return {
      message: `用户角色已更新为${updateRoleDto.role}`,
      user,
    };
  }

  /**
   * 重置用户密码
   */
  @Put(':id/password')
  @Roles('admin' as any)
  @ApiOperation({ summary: '重置用户密码', description: '管理员重置用户密码' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '重置成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetUserPasswordDto
  ): Promise<{ message: string; user: any }> {
    const user = await this.userService.resetUserPassword(id, resetPasswordDto.password);
    return {
      message: '用户密码已重置',
      user,
    };
  }

  /**
   * 验证用户邮箱
   */
  @Put(':id/verify-email')
  @Roles('admin' as any)
  @ApiOperation({ summary: '验证用户邮箱', description: '管理员手动验证用户邮箱' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async verifyUserEmail(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.userService.verifyUserEmail(id);
    return { message: '用户邮箱已验证' };
  }

  /**
   * 获取用户统计信息
   */
  @Get('stats/overview')
  @Roles('admin' as any, 'staff' as any)
  @ApiOperation({ summary: '获取用户统计信息', description: '获取用户总数、角色分布等统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    roleDistribution: { role: string; count: number }[];
    recentRegistrations: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      roleStats,
      recentRegistrations
    ] = await Promise.all([
      this.userService.getUsers({ page_size: 1 }).then(result => result.total),
      this.userService.getUsers({ is_active: true, page_size: 1 }).then(result => result.total),
      this.userService.getUsers({ is_verified: true, page_size: 1 }).then(result => result.total),
      this.userService.getUsers({ page_size: 1 }).then(async () => {
        const [userCount, staffCount, adminCount] = await Promise.all([
          this.userService.getUsers({ role: 'user', page_size: 1 }).then(result => result.total),
          this.userService.getUsers({ role: 'staff', page_size: 1 }).then(result => result.total),
          this.userService.getUsers({ role: 'admin', page_size: 1 }).then(result => result.total),
        ]);
        return [
          { role: 'user', count: userCount },
          { role: 'staff', count: staffCount },
          { role: 'admin', count: adminCount },
        ];
      }),
      this.userService.getUsers({ 
        page_size: 1,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }).then(result => {
        // 计算最近7天注册的用户数
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return result.records.filter(user => 
          new Date(user.created_at) >= sevenDaysAgo
        ).length;
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      roleDistribution: await roleStats,
      recentRegistrations,
    };
  }
}

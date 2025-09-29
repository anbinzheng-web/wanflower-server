import { Controller, Get, UseGuards, Request, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { RolesGuard } from 'auth/roles.guard';
import { UserService } from 'user/services/user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async me(@Request() req) {
    // req.user 是 JwtStrategy validate 返回的对象
    return await this.userService.findById(req.user.userId);
  }

  // 管理员可以列出所有用户
  @Get()
  @Roles(Role.Admin)
  async listAll() {
    return this.userService['prisma'].user.findMany({ select: { id: true, email: true, role: true, created_at: true }});
  }

  // 管理员修改用户角色
  @Post(':id/role')
  @Roles(Role.Admin)
  async setRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: Role) {
    return this.userService.setRole(id, role);
  }
}

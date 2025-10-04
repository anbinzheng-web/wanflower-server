import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 用户列表查询DTO
 */
export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 10;

  @ApiPropertyOptional({ description: '搜索关键词（邮箱、姓名）', example: 'admin' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '角色筛选', enum: ['user', 'staff', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'staff', 'admin'])
  role?: string;

  @ApiPropertyOptional({ description: '验证状态筛选', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: '激活状态筛选', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: '排序字段', example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 创建用户DTO
 */
export class CreateUserDto {
  @ApiProperty({ description: '邮箱地址', example: 'newuser@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ description: '角色', enum: ['user', 'staff', 'admin'], example: 'user' })
  @IsEnum(['user', 'staff', 'admin'])
  role: string;

  @ApiPropertyOptional({ description: '名字', example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: '姓氏', example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: '手机号', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: '是否已验证', example: true })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean = false;

  @ApiPropertyOptional({ description: '是否激活', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

/**
 * 更新用户DTO
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: '邮箱地址', example: 'updated@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '密码', example: 'newpassword123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['user', 'staff', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'staff', 'admin'])
  role?: string;

  @ApiPropertyOptional({ description: '名字', example: 'Jane' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: '姓氏', example: 'Smith' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: '手机号', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: '是否已验证', example: true })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: '是否激活', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

/**
 * 用户状态更新DTO
 */
export class UpdateUserStatusDto {
  @ApiProperty({ description: '是否激活', example: true })
  @IsBoolean()
  is_active: boolean;
}

/**
 * 用户角色更新DTO
 */
export class UpdateUserRoleDto {
  @ApiProperty({ description: '角色', enum: ['user', 'staff', 'admin'], example: 'staff' })
  @IsEnum(['user', 'staff', 'admin'])
  role: string;
}

/**
 * 用户密码重置DTO
 */
export class ResetUserPasswordDto {
  @ApiProperty({ description: '新密码', example: 'newpassword123' })
  @IsString()
  password: string;
}

/**
 * 用户响应DTO
 */
export class UserResponseDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '角色', example: 'user' })
  role: string;

  @ApiPropertyOptional({ description: '名字', example: 'John' })
  first_name?: string;

  @ApiPropertyOptional({ description: '姓氏', example: 'Doe' })
  last_name?: string;

  @ApiPropertyOptional({ description: '手机号', example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL', example: 'https://example.com/avatar.jpg' })
  avatar_url?: string;

  @ApiProperty({ description: '是否已验证', example: true })
  is_verified: boolean;

  @ApiProperty({ description: '是否激活', example: true })
  is_active: boolean;

  @ApiPropertyOptional({ description: '最后登录时间', example: '2024-01-15T10:30:00Z' })
  last_login?: Date;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-15T10:30:00Z' })
  updated_at: Date;
}

/**
 * 用户列表响应DTO
 */
export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  records: UserResponseDto[];

  @ApiProperty({ description: '总数量', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  page_size: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;
}

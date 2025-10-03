import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsString()
  password: string;
}

// 导出用户管理相关的DTO
export * from './user-management.dto';

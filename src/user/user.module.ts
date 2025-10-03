import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { UserManagementController } from './controllers/user-management.controller';

@Module({
  providers: [UserService],
  controllers: [UserController, UserManagementController],
  exports: [UserService],
})
export class UsersModule {}

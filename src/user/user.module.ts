import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { UserManagementController } from './controllers/user-management.controller';
import { UserActivityController } from './controllers/user-activity.controller';
import { UserActivityService } from 'shared/services/user-activity.service';

@Module({
  providers: [UserService, UserActivityService],
  controllers: [UserController, UserManagementController, UserActivityController],
  exports: [UserService, UserActivityService],
})
export class UsersModule {}

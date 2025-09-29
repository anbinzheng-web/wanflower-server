import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { ProductModule } from 'product/product.module';
import { ReviewModule } from 'review/review.module';
import { BlogModule } from 'blog/blog.module';
import { AuthModule } from 'auth/auth.module';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'shared/logger/logger.module';
import { LoggerInterceptor } from 'shared/logger/logger.interceptor';

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    ProductModule,
    ReviewModule,
    BlogModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule {}

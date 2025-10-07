import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger'; // 导入 Swagger 相关模块
import { ResponseInterceptor } from 'shared/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { registerGlobalProperties } from './globalProperties';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 配置 cookie 解析中间件
  app.use(cookieParser());
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 👈 自动类型转换
      whitelist: true, // 过滤掉 DTO 里没定义的字段
      forbidNonWhitelisted: true, // 遇到非法字段直接报错
      transformOptions: { enableImplicitConversion: false }, // 我们用 @Transform 显式转换
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor)
  // AllExceptionsFilter 现在通过 APP_FILTER 在模块中注册
  app.useStaticAssets(process.env.IMAGE_LOCAL_UPLOAD_PATH || 'uploads', { prefix: '/images' });

  // 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('wanflower') // 设置 API 标题
    .setDescription('shopping') // 设置 API 描述
    .setVersion('1.0') // 设置 API 版本
    // .addTag('你的 API 标签') // 添加 API 标签
    .addBasicAuth() // 添加基本认证（如果需要）
    .build(); // 构建配置
  const document = SwaggerModule.createDocument(app, config);
  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true, // 保持授权信息
    },
    customSiteTitle: 'wanflower api documents', // 设置自定义页面标题
    jsonDocumentUrl: 'openapi.json'
  };
  SwaggerModule.setup('docs', app, document, options); // 'docs' 是 Swagger UI 的访问路径

  await app.listen(process.env.PORT || 3000);
}
registerGlobalProperties();
(() => {
  const uploadPath = path.join(process.cwd(), process.env.IMAGE_LOCAL_UPLOAD_PATH!);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // 递归创建
  }
})();
bootstrap();

// main.ts
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};
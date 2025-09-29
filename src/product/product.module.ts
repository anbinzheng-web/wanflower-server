import { Module } from "@nestjs/common";
import { ProductController } from './controllers/product.controller';
import { ProductServer } from './servers/product.server';

@Module({
  controllers: [ProductController],
  providers: [ProductServer]
})
export class ProductModule {

}
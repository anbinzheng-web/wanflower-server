import { Module } from "@nestjs/common";
import { ProductController } from './controllers/product.controller';
import { ProductService } from './servers/product.server';
import { ProductMediaService } from './services/product-media.service';
import { SharedModule } from 'shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ProductController],
  providers: [ProductService, ProductMediaService],
  exports: [ProductService, ProductMediaService]
})
export class ProductModule {}
import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { CartController } from './controllers/cart.controller';
import { AddressController } from './controllers/address.controller';
import { OrderSchedulerController } from './controllers/order-scheduler.controller';
import { OrderService } from './services/order.service';
import { CartService } from './services/cart.service';
import { AddressValidationService } from './services/address-validation.service';
import { SharedModule } from 'shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [OrderController, CartController, AddressController, OrderSchedulerController],
  providers: [OrderService, CartService, AddressValidationService],
  exports: [OrderService, CartService, AddressValidationService]
})
export class OrderModule {}

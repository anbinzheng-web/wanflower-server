import { Module } from "@nestjs/common";
import { ReviewController } from './review.controler';

@Module({
  controllers: [ReviewController],
})
export class ReviewModule {

}
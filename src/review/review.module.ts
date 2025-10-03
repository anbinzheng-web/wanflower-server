import { Module } from "@nestjs/common";
import { ReviewController } from './review.controler';
import { ReviewService } from './review.service';
import { ReviewMediaService } from './review-media.service';
import { SharedModule } from 'shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewMediaService],
  exports: [ReviewService, ReviewMediaService]
})
export class ReviewModule {}
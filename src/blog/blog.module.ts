import { Module } from "@nestjs/common";
import { BlogController } from "./blog.controller";
import { BlogService } from "./blog.service";
import { BlogMediaService } from "./blog-media.service";
import { SharedModule } from "shared/shared.module";

@Module({
  imports: [SharedModule],
  controllers: [BlogController],
  providers: [BlogService, BlogMediaService],
  exports: [BlogService, BlogMediaService],
})
export class BlogModule {}
import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { EmailModule } from "@shared/email/email.module";
import { ArticleController } from "./article.controller";
import { ArticleService } from "./article.service";

@Module({
  imports: [ConfigModule, EmailModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
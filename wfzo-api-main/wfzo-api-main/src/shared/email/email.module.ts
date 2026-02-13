import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { EmailService } from "./email.service";
import { EmailController } from "./email.controller";
import { EmailTemplate, EmailTemplateSchema } from "./schemas/email-template.schema";
import { EmailTemplateRepository } from "./repository/email-template.repository";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: EmailTemplate.name, schema: EmailTemplateSchema }]),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailTemplateRepository],
  exports: [EmailService, EmailTemplateRepository],
})
export class EmailModule {}

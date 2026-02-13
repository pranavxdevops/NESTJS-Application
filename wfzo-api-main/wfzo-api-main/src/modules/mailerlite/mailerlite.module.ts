import { Module } from '@nestjs/common';
import { MailerLiteController } from './mailerlite.controller';
import { MailerLiteService } from './mailerlite.service';

@Module({
  controllers: [MailerLiteController],
  providers: [MailerLiteService],
  exports: [MailerLiteService],
})
export class MailerLiteModule {}
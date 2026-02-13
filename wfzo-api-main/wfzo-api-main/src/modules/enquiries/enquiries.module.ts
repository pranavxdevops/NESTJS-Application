import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "@shared/email/email.module";
import { EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";
import { EnquiriesRepository } from "./repository/enquiries.repository";
import { Enquiry, EnquirySchema } from "./schemas/enquiry.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Enquiry.name, schema: EnquirySchema }]),
    EmailModule,
  ],
  controllers: [EnquiriesController],
  providers: [EnquiriesService, EnquiriesRepository],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
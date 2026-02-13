import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RequestsController } from "./requests.controller";
import { RequestsService } from "./requests.service";
import { RequestsRepository } from "./repository/requests.repository";
import { Request, RequestSchema } from "./schemas/request.schema";
import { MemberModule } from "@modules/member/member.module";
import { EmailModule } from "@shared/email/email.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    forwardRef(() => MemberModule),
    EmailModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsRepository],
  exports: [RequestsService],
})
export class RequestsModule {}

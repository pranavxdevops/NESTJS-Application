import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { PaymentRepository } from "./repository/payment.repository";
import { Payment, PaymentSchema } from "./schemas/payment.schema";
import { PaytabPaymentGatewayService } from "./services/paytab-payment-gateway.service";
import { Counter, CounterSchema } from "@shared/schemas/counter.schema";
import { MemberModule } from "@modules/member/member.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    forwardRef(() => MemberModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentRepository, PaymentService, PaytabPaymentGatewayService],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}


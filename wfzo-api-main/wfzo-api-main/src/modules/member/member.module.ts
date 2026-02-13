import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";
import { MemberRepository } from "./repository/member.repository";
import { Member, MemberSchema } from "./schemas/member.schema";
import { Counter, CounterSchema } from "@shared/schemas/counter.schema";
import { UserModule } from "@modules/user/user.module";
import { GeocodingModule } from "@shared/geocoding/geocoding.module";
import { EmailModule } from "@shared/email/email.module";
import { MasterdataModule } from "@modules/masterdata/masterdata.module";
import { PaymentModule } from "@modules/payment/payment.module";

// Workflow components
import { WorkflowOrchestrator } from "./workflow/services/workflow-orchestrator.service";
import { WorkflowNotificationService } from "./workflow/services/workflow-notification.service";
import {
  Phase1Handler,
  Phase2Handler,
  Phase3Handler,
  ApprovalHandler,
  RejectionHandler,
  PaymentHandler,
} from "./workflow/handlers";

// Workflow validators
import { WorkflowValidatorFactory } from "./workflow/validators/workflow-validator.factory";
import { ApprovalTransitionValidator } from "./workflow/validators/approval-transition.validator";
import { SequentialApprovalValidator } from "./workflow/validators/sequential-approval.validator";
import { ApprovalOrderValidator } from "./workflow/validators/approval-order.validator";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    UserModule,
    GeocodingModule,
    EmailModule,
    MasterdataModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [MemberController],
  providers: [
    MemberRepository,
    MemberService,
    // Workflow services
    WorkflowOrchestrator,
    WorkflowNotificationService,
    // Workflow handlers
    Phase1Handler,
    Phase2Handler,
    Phase3Handler,
    ApprovalHandler,
    RejectionHandler,
    PaymentHandler,
    // Workflow validators
    WorkflowValidatorFactory,
    ApprovalTransitionValidator,
    SequentialApprovalValidator,
    ApprovalOrderValidator,
    // Note: Dropdown validators are registered globally in AppModule
  ],
  exports: [MemberService, WorkflowOrchestrator],
})
export class MemberModule {}

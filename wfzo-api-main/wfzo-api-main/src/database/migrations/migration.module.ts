import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MigrationService } from "./migration.service";
import { Member, MemberSchema } from "../../modules/member/schemas/member.schema";
import { Event, EventSchema } from "../../modules/events/schemas/event.schema";
import { User, UserSchema } from "../../modules/user/schemas/user.schema";
import { Document, DocumentSchema } from "../../modules/document/schemas/document.schema";
import { Membership, MembershipSchema } from "../../modules/membership/schemas/membership.schema";
import {
  DropdownValue,
  DropdownValueSchema,
} from "../../modules/masterdata/schemas/dropdown-value.schema";
import { FormField, FormFieldSchema } from "../../modules/masterdata/schemas/form-field.schema";
import {
  WorkflowTransition,
  WorkflowTransitionSchema,
} from "../../modules/masterdata/schemas/workflow-transition.schema";
import { Counter, CounterSchema } from "../../shared/schemas/counter.schema";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../../shared/email/schemas/email-template.schema";

/**
 * Migration module - handles database schema migrations
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: DropdownValue.name, schema: DropdownValueSchema },
      { name: FormField.name, schema: FormFieldSchema },
      { name: WorkflowTransition.name, schema: WorkflowTransitionSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}

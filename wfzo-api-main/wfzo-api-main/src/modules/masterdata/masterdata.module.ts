import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MasterdataController } from "./masterdata.controller";
import { MasterdataService } from "./masterdata.service";
import { FormField, FormFieldSchema } from "./schemas/form-field.schema";
import { DropdownValue, DropdownValueSchema } from "./schemas/dropdown-value.schema";
import { WorkflowTransition, WorkflowTransitionSchema } from "./schemas/workflow-transition.schema";
import { FormFieldRepository } from "./repository/form-field.repository";
import { DropdownValueRepository } from "./repository/dropdown-value.repository";
import { WorkflowTransitionRepository } from "./repository/workflow-transition.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FormField.name, schema: FormFieldSchema },
      { name: DropdownValue.name, schema: DropdownValueSchema },
      { name: WorkflowTransition.name, schema: WorkflowTransitionSchema },
    ]),
  ],
  controllers: [MasterdataController],
  providers: [
    MasterdataService,
    FormFieldRepository,
    DropdownValueRepository,
    WorkflowTransitionRepository,
  ],
  exports: [
    MasterdataService, 
    WorkflowTransitionRepository,
    MongooseModule, // Export MongooseModule to make DropdownValue model available to other modules
  ],
})
export class MasterdataModule {}

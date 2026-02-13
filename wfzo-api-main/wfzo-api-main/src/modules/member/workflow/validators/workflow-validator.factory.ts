import { Injectable } from "@nestjs/common";
import { ValidatorChainBuilder } from "@shared/workflow";
import { IWorkflowValidator, MemberValidationContext } from "./base-workflow-validator";
import { ApprovalTransitionValidator } from "./approval-transition.validator";
import { SequentialApprovalValidator } from "./sequential-approval.validator";
import { ApprovalOrderValidator } from "./approval-order.validator";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";

/**
 * Factory for creating member workflow validation chains
 * Uses the shared ValidatorChainBuilder for chain construction
 */
@Injectable()
export class WorkflowValidatorFactory {
  constructor(private readonly workflowTransitionRepository: WorkflowTransitionRepository) {}

  /**
   * Creates the approval workflow validation chain
   * Order: Transition → Sequential → Approval Order
   */
  createApprovalValidationChain(): IWorkflowValidator<MemberValidationContext> {
    // Create validators (workflow-specific responsibility)
    const transitionValidator = new ApprovalTransitionValidator(this.workflowTransitionRepository);
    const sequentialValidator = new SequentialApprovalValidator(this.workflowTransitionRepository);
    const orderValidator = new ApprovalOrderValidator(this.workflowTransitionRepository);

    // Build chain using shared utility (generic responsibility)
    return ValidatorChainBuilder.create(transitionValidator, sequentialValidator, orderValidator);
  }
}

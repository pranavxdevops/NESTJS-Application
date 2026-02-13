import { Injectable, Logger } from "@nestjs/common";
import {
  BaseWorkflowValidator,
  MemberValidationContext,
  ValidationResult,
} from "./base-workflow-validator";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";

/**
 * Validates that a valid transition exists for the current status
 */
@Injectable()
export class ApprovalTransitionValidator extends BaseWorkflowValidator {
  private readonly logger = new Logger(ApprovalTransitionValidator.name);

  constructor(private readonly workflowTransitionRepository: WorkflowTransitionRepository) {
    super();
  }

  protected async doValidate(context: MemberValidationContext): Promise<ValidationResult> {
    this.logger.log(`Validating transition for status: ${context.currentStatus}`);

    const transition = await this.workflowTransitionRepository.getTransition(
      WorkflowType.MEMBER_ONBOARDING,
      context.currentStatus,
    );

    if (!transition) {
      return {
        isValid: false,
        error: `Cannot approve from status: ${context.currentStatus}. No valid workflow transition found for ${WorkflowType.MEMBER_ONBOARDING}`,
      };
    }

    // Store transition in context for subsequent validators
    context.transition = {
      nextStatus: transition.nextStatus,
      phase: transition.phase,
      approvalStage: transition.approvalStage,
      order: transition.order,
    };

    this.logger.log(
      `Transition validation passed: ${context.currentStatus} → ${transition.nextStatus}`,
    );
    return { isValid: true };
  }
}

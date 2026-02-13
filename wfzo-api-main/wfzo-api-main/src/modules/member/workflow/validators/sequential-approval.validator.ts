import { Injectable, Logger } from "@nestjs/common";
import {
  BaseWorkflowValidator,
  MemberValidationContext,
  ValidationResult,
} from "./base-workflow-validator";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";

/**
 * Validates that the workflow follows the correct sequential order
 * Prevents skipping approval stages
 */
@Injectable()
export class SequentialApprovalValidator extends BaseWorkflowValidator {
  private readonly logger = new Logger(SequentialApprovalValidator.name);

  constructor(private readonly workflowTransitionRepository: WorkflowTransitionRepository) {
    super();
  }

  protected async doValidate(context: MemberValidationContext): Promise<ValidationResult> {
    if (!context.transition) {
      return {
        isValid: false,
        error: "Transition information is required for sequential validation",
      };
    }

    this.logger.log(
      `Validating sequential workflow for status: ${context.currentStatus} (order: ${context.transition.order})`,
    );

    // Load all workflow transitions from database to validate sequence
    const allTransitions = await this.workflowTransitionRepository.getWorkflowTransitions(
      WorkflowType.MEMBER_ONBOARDING,
    );

    if (!allTransitions || allTransitions.length === 0) {
      return {
        isValid: false,
        error: `No workflow transitions found for ${WorkflowType.MEMBER_ONBOARDING}`,
      };
    }

    // Get all valid statuses from database
    const validStatuses = allTransitions.map((t) => t.currentStatus);

    // Validate current status is in the workflow
    if (!validStatuses.includes(context.currentStatus)) {
      return {
        isValid: false,
        error: `Invalid approval status: ${context.currentStatus}. Must be one of: ${validStatuses.join(", ")}`,
      };
    }

    // Validate order matches the transition in database
    const transitionForCurrentStatus = allTransitions.find(
      (t) => t.currentStatus === context.currentStatus,
    );

    if (!transitionForCurrentStatus) {
      return {
        isValid: false,
        error: `No transition found for current status: ${context.currentStatus}`,
      };
    }

    // Ensure the order matches what's expected from database
    if (transitionForCurrentStatus.order !== context.transition.order) {
      return {
        isValid: false,
        error: `Order mismatch: Expected order ${transitionForCurrentStatus.order} for status ${context.currentStatus}, but got ${context.transition.order}`,
      };
    }

    this.logger.log(
      `Sequential validation passed: ${context.currentStatus} → ${context.transition.nextStatus} (Order ${context.transition.order})`,
    );

    return { isValid: true };
  }
}

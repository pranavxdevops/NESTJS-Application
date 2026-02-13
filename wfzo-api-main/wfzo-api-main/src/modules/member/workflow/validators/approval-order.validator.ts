import { Injectable, Logger } from "@nestjs/common";
import {
  BaseWorkflowValidator,
  MemberValidationContext,
  ValidationResult,
} from "./base-workflow-validator";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";

/**
 * Validates that approvals are being done in the correct order
 * Checks approval history to ensure no stages are skipped
 */
@Injectable()
export class ApprovalOrderValidator extends BaseWorkflowValidator {
  private readonly logger = new Logger(ApprovalOrderValidator.name);

  constructor(private readonly workflowTransitionRepository: WorkflowTransitionRepository) {
    super();
  }

  protected async doValidate(context: MemberValidationContext): Promise<ValidationResult> {
    if (!context.transition) {
      return {
        isValid: false,
        error: "Transition information is required for order validation",
      };
    }

    const currentOrder = context.transition.order;
    console.log("Current approval order being validated:", context);
    this.logger.log(
      `Validating approval order for: ${context.entity.memberId} (order: ${currentOrder})`,
    );

    const approvalHistory = context.entity.approvalHistory || [];

    // CRITICAL CHECK: Validate approval order based on stage
    // Special case for committee: allow multiple approvals at order 1
    if (currentOrder === 1 && context.transition?.approvalStage === "committee") {
      // For committee, allow multiple approvals - the approval handler will check the total count
      this.logger.log(`Allowing multiple committee approvals - found ${approvalHistory.length} existing approvals`);
    }
    // For other stages (CEO), the transition logic ensures proper progression
    // No additional checks needed since status transition validates the workflow

    // Verify each previous stage has been completed (either approved or rejected)
    for (let order = 1; order < currentOrder; order++) {
      const approval = approvalHistory.find((a) => a.order === order);
      const rejection = context.entity.rejectionHistory?.find((r) => r.order === order);

      // A stage is considered completed if it has either an approval or a rejection
      if (!approval && !rejection) {
        const stageName = await this.getStageNameByOrder(order);
        return {
          isValid: false,
          error: `Invalid approval order: ${stageName} stage (order ${order}) has not been completed yet`,
        };
      }
    }

    // Special handling for committee approvals - allow multiple but not from same user
    if (currentOrder === 1 && context.transition?.approvalStage === "committee") {
      // Check if this user has already acted at committee stage
      const existingAction = approvalHistory.find((a) =>
        a.order === currentOrder &&
        a.approverEmail === context.currentUserEmail
      );
      if (existingAction) {
        return {
          isValid: false,
          error: `You have already provided feedback for this application at the committee stage`,
        };
      }
      this.logger.log(`Allowing committee approval from ${context.currentUserEmail} at order ${currentOrder}`);
    } else {
      // For other stages, ensure this specific order hasn't been approved yet
      const alreadyApproved = approvalHistory.find((a) => a.order === currentOrder);
      if (alreadyApproved) {
        const stageName = await this.getStageNameByOrder(currentOrder);
        return {
          isValid: false,
          error: `Invalid approval order: ${stageName} approval has already been completed`,
        };
      }
    }

    this.logger.log(`Approval order validation passed for: ${context.entity.memberId}`);
    return { isValid: true };
  }

  /**
   * Get stage name by order number (Database-Driven)
   */
  private async getStageNameByOrder(order: number): Promise<string> {
    const transition = await this.workflowTransitionRepository.getTransitionByOrder(
      WorkflowType.MEMBER_ONBOARDING,
      order,
    );
    return transition?.approvalStage || "Unknown";
  }
}

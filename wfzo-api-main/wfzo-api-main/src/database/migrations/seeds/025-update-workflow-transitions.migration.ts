import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  WorkflowTransition,
  WorkflowType,
} from "../../../modules/masterdata/schemas/workflow-transition.schema";

/**
 * Migration: Update workflow transitions to remove board approval stage
 *
 * This migration updates the workflow transitions for Member Onboarding
 * to remove the board approval stage: Committee → CEO → Payment
 */
export class UpdateWorkflowTransitionsMigration implements Migration {
  name = "025-update-workflow-transitions";

  constructor(private readonly workflowTransitionModel: Model<WorkflowTransition>) {}

  async up(): Promise<void> {
    console.log("Updating workflow transitions to remove board approval stage...");

    // Remove the board approval transition
    await this.workflowTransitionModel.deleteOne({
      workflowType: WorkflowType.MEMBER_ONBOARDING,
      currentStatus: "pendingBoardApproval",
    });

    // Update committee approval transition to go directly to CEO
    await this.workflowTransitionModel.updateOne(
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCommitteeApproval",
      },
      {
        $set: {
          nextStatus: "pendingCEOApproval",
          description: "Committee reviews and approves the membership application",
        },
      },
    );

    // Update CEO approval order from 3 to 2
    await this.workflowTransitionModel.updateOne(
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCEOApproval",
      },
      {
        $set: {
          order: 2,
          description: "CEO provides final approval before payment",
        },
      },
    );

    console.log("✓ Workflow transitions updated successfully");
  }

  async down(): Promise<void> {
    console.log("Reverting workflow transitions update...");

    // Revert CEO order back to 3
    await this.workflowTransitionModel.updateOne(
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCEOApproval",
      },
      {
        $set: {
          order: 3,
          description: "CEO provides final approval before payment",
        },
      },
    );

    // Revert committee transition back to board
    await this.workflowTransitionModel.updateOne(
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCommitteeApproval",
      },
      {
        $set: {
          nextStatus: "pendingBoardApproval",
          description: "Committee reviews and approves the membership application",
        },
      },
    );

    // Re-add board approval transition
    await this.workflowTransitionModel.updateOne(
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingBoardApproval",
        nextStatus: "pendingCEOApproval",
        phase: "BOARD_APPROVAL",
        approvalStage: "board",
        order: 2,
        isActive: true,
        description: "Board reviews and approves after committee approval",
      },
      {
        $setOnInsert: {
          workflowType: WorkflowType.MEMBER_ONBOARDING,
          currentStatus: "pendingBoardApproval",
          nextStatus: "pendingCEOApproval",
          phase: "BOARD_APPROVAL",
          approvalStage: "board",
          order: 2,
          isActive: true,
          description: "Board reviews and approves after committee approval",
        },
      },
      { upsert: true },
    );

    console.log("✓ Workflow transitions reverted");
  }
}
import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  WorkflowTransition,
  WorkflowType,
} from "../../../modules/masterdata/schemas/workflow-transition.schema";

/**
 * Migration: Seed workflow transitions for Member Onboarding
 *
 * This migration populates the workflowTransitions collection with the approval
 * flow for member onboarding: Committee → Board → CEO → Payment
 */
export class WorkflowTransitionsMigration implements Migration {
  name = "015-workflow-transitions";

  constructor(private readonly workflowTransitionModel: Model<WorkflowTransition>) {}

  async up(): Promise<void> {
    console.log("Seeding workflow transitions for Member Onboarding...");

    const transitions: Partial<WorkflowTransition>[] = [
      // ==================== MEMBER ONBOARDING WORKFLOW ====================
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCommitteeApproval",
        nextStatus: "pendingBoardApproval",
        phase: "COMMITTEE_APPROVAL", // WorkflowPhase enum value
        approvalStage: "committee",
        order: 1,
        isActive: true,
        description: "Committee reviews and approves the membership application",
      },
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingBoardApproval",
        nextStatus: "pendingCEOApproval",
        phase: "BOARD_APPROVAL", // WorkflowPhase enum value
        approvalStage: "board",
        order: 2,
        isActive: true,
        description: "Board reviews and approves after committee approval",
      },
      {
        workflowType: WorkflowType.MEMBER_ONBOARDING,
        currentStatus: "pendingCEOApproval",
        nextStatus: "approvedPendingPayment",
        phase: "CEO_APPROVAL", // WorkflowPhase enum value
        approvalStage: "ceo",
        order: 3,
        isActive: true,
        description: "CEO provides final approval before payment",
      },
    ];

    // Use bulkWrite for efficient upsert operations
    const bulkOps = transitions.map((transition) => ({
      updateOne: {
        filter: {
          workflowType: transition.workflowType,
          currentStatus: transition.currentStatus,
        },
        update: { $set: transition },
        upsert: true,
      },
    }));

    const result = await this.workflowTransitionModel.bulkWrite(bulkOps);

    console.log(
      `✓ Workflow Transitions migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing workflow transitions for Member Onboarding...");

    await this.workflowTransitionModel.deleteMany({
      workflowType: WorkflowType.MEMBER_ONBOARDING,
    });

    console.log("✓ Workflow Transitions removed");
  }
}

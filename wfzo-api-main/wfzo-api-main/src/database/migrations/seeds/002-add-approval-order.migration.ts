import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { Member } from "../../../modules/member/schemas/member.schema";

/**
 * Migration: Add order field to approval and rejection history entries
 *
 * This migration adds an `order` field to existing approval and rejection history entries
 * to enforce strict workflow sequence:
 * - Approval: Committee (1) → Board (2) → CEO (3)
 * - Rejection: Same order validation - can only reject at current stage after previous approvals
 */
export class AddApprovalOrderMigration implements Migration {
  name = "002-add-approval-order";

  constructor(private readonly memberModel: Model<Member>) {}

  async up(): Promise<void> {
    console.log("Adding order field to approval and rejection history entries...");

    // Find all members with approval or rejection history
    const members = await this.memberModel
      .find({
        $or: [
          { approvalHistory: { $exists: true, $ne: [] } },
          { rejectionHistory: { $exists: true, $ne: [] } },
        ],
      })
      .lean();

    console.log(`Found ${members.length} members with approval/rejection history to migrate`);

    for (const member of members) {
      const updates: any = {};

      // Update approval history
      if (member.approvalHistory && member.approvalHistory.length > 0) {
        const updatedApprovalHistory = member.approvalHistory.map((approval) => {
          let order: number;
          switch (approval.approvalStage) {
            case "committee":
              order = 1;
              break;
            case "board":
              order = 2;
              break;
            case "ceo":
              order = 3;
              break;
            default:
              console.warn(
                `Unknown approval stage: ${approval.approvalStage} for member ${member.memberId}`,
              );
              order = 0;
          }
          return { ...approval, order };
        });
        updates.approvalHistory = updatedApprovalHistory;
      }

      // Update rejection history
      if (member.rejectionHistory && member.rejectionHistory.length > 0) {
        const updatedRejectionHistory = member.rejectionHistory.map((rejection) => {
          let order: number;
          switch (rejection.rejectionStage) {
            case "committee":
              order = 1;
              break;
            case "board":
              order = 2;
              break;
            case "ceo":
              order = 3;
              break;
            case "admin":
              order = 0;
              break;
            default:
              console.warn(
                `Unknown rejection stage: ${rejection.rejectionStage} for member ${member.memberId}`,
              );
              order = 0;
          }
          return { ...rejection, order };
        });
        updates.rejectionHistory = updatedRejectionHistory;
      }

      // Update the member if there are changes
      if (Object.keys(updates).length > 0) {
        await this.memberModel.updateOne({ _id: member._id }, { $set: updates });
      }
    }

    console.log(
      `✓ Successfully added order field to approval and rejection history for ${members.length} members`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing order field from approval and rejection history entries...");

    // Remove order field from all approval and rejection history entries
    await this.memberModel.updateMany(
      {},
      {
        $unset: {
          "approvalHistory.$[].order": "",
          "rejectionHistory.$[].order": "",
        },
      },
    );

    console.log("✓ Successfully removed order field from approval and rejection history");
  }
}

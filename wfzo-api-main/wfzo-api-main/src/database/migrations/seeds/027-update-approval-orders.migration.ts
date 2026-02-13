import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { Member } from "../../../modules/member/schemas/member.schema";

/**
 * Migration: Update approval orders to remove board stage
 *
 * This migration updates existing approval and rejection history entries
 * to reflect the new workflow: Committee (1) → CEO (2)
 * - Removes any board approval/rejection entries (order 2)
 * - Updates CEO approvals from order 3 to order 2
 */
export class UpdateApprovalOrdersMigration implements Migration {
  name = "027-update-approval-orders";

  constructor(private readonly memberModel: Model<Member>) {}

  async up(): Promise<void> {
    console.log("Updating approval orders to remove board stage...");

    // Find all members with approval or rejection history
    const members = await this.memberModel
      .find({
        $or: [
          { approvalHistory: { $exists: true, $ne: [] } },
          { rejectionHistory: { $exists: true, $ne: [] } },
        ],
      })
      .lean();

    console.log(`Found ${members.length} members with approval/rejection history to update`);

    for (const member of members) {
      const updates: any = {};

      // Update approval history
      if (member.approvalHistory && member.approvalHistory.length > 0) {
        const updatedApprovalHistory = member.approvalHistory
          .filter((approval) => approval.approvalStage !== "board") // Remove board approvals
          .map((approval) => {
            let order: number = approval.order;
            if (approval.approvalStage === "ceo" && approval.order === 3) {
              order = 2; // Update CEO from order 3 to 2
            }
            return { ...approval, order };
          });
        updates.approvalHistory = updatedApprovalHistory;
      }

      // Update rejection history
      if (member.rejectionHistory && member.rejectionHistory.length > 0) {
        const updatedRejectionHistory = member.rejectionHistory
          .filter((rejection) => rejection.rejectionStage !== "board") // Remove board rejections
          .map((rejection) => {
            let order: number = rejection.order;
            if (rejection.rejectionStage === "ceo" && rejection.order === 3) {
              order = 2; // Update CEO from order 3 to 2
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
      `✓ Successfully updated approval orders for ${members.length} members (removed board stage)`,
    );
  }

  async down(): Promise<void> {
    console.log("Reverting approval order updates...");

    // Note: This down migration cannot fully restore board approvals as they were removed
    // It can only adjust orders back, but board entries are lost
    // In a production scenario, you might need a backup or more sophisticated rollback

    const members = await this.memberModel
      .find({
        $or: [
          { approvalHistory: { $exists: true, $ne: [] } },
          { rejectionHistory: { $exists: true, $ne: [] } },
        ],
      })
      .lean();

    for (const member of members) {
      const updates: any = {};

      // Revert approval history orders
      if (member.approvalHistory && member.approvalHistory.length > 0) {
        const updatedApprovalHistory = member.approvalHistory.map((approval) => {
          let order: number = approval.order;
          if (approval.approvalStage === "ceo" && approval.order === 2) {
            order = 3; // Revert CEO back to order 3
          }
          return { ...approval, order };
        });
        updates.approvalHistory = updatedApprovalHistory;
      }

      // Revert rejection history orders
      if (member.rejectionHistory && member.rejectionHistory.length > 0) {
        const updatedRejectionHistory = member.rejectionHistory.map((rejection) => {
          let order: number = rejection.order;
          if (rejection.rejectionStage === "ceo" && rejection.order === 2) {
            order = 3; // Revert CEO back to order 3
          }
          return { ...rejection, order };
        });
        updates.rejectionHistory = updatedRejectionHistory;
      }

      if (Object.keys(updates).length > 0) {
        await this.memberModel.updateOne({ _id: member._id }, { $set: updates });
      }
    }

    console.log("✓ Reverted approval order updates");
  }
}
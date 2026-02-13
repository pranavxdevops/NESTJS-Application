import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { EmailTemplate } from "../../../shared/email/schemas/email-template.schema";

export class UpdatePaymentLinkTemplateProcessMigration implements Migration {
  name = "030-update-payment-link-template-process";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Updating MEMBER_PAYMENT_LINK template to add process field...");

    const result = await this.emailTemplateModel.updateOne(
      { templateCode: "MEMBER_PAYMENT_LINK" },
      {
        $set: {
          process: "memberOnboarding",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Added process field to MEMBER_PAYMENT_LINK template");
    } else {
      console.log("ℹ MEMBER_PAYMENT_LINK template was not found or already has process field");
    }
  }

  async down(): Promise<void> {
    console.log("Removing process field from MEMBER_PAYMENT_LINK template...");

    const result = await this.emailTemplateModel.updateOne(
      { templateCode: "MEMBER_PAYMENT_LINK" },
      {
        $unset: {
          process: "",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Removed process field from MEMBER_PAYMENT_LINK template");
    } else {
      console.log("ℹ MEMBER_PAYMENT_LINK template was not found or already has no process field");
    }
  }
}
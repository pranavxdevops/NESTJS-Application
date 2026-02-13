import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { EmailTemplate } from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration to add 'process' field to existing email templates
 * This groups templates by workflow (e.g., memberOnboarding, eventRegistration)
 */
export class UpdateEmailTemplatesWithProcess implements Migration {
  name = "016-update-email-templates-with-process";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Adding 'process' field to member onboarding email templates...");

    // Update all member workflow templates with process: "memberOnboarding"
    const memberOnboardingTemplates = [
      "MEMBER_PHASE1_CONFIRMATION",
      "MEMBER_PHASE2_CONFIRMATION",
      "MEMBER_PHASE2_ADMIN_NOTIFICATION",
      "MEMBER_APPROVAL",
      "MEMBER_REJECTION",
      "MEMBER_PAYMENT_LINK",
      "MEMBER_WELCOME",
    ];

    const result = await this.emailTemplateModel.updateMany(
      { templateCode: { $in: memberOnboardingTemplates } },
      { $set: { process: "memberOnboarding" } },
    );

    console.log(`✓ Updated ${result.modifiedCount} email templates with memberOnboarding process`);
  }

  async down(): Promise<void> {
    console.log("Removing 'process' field from email templates...");

    await this.emailTemplateModel.updateMany({}, { $unset: { process: "" } });

    console.log("✓ Removed 'process' field from email templates");
  }
}

import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for organization notifications
 *
 * This migration adds email template for organization approval workflow:
 * 1. ORGANIZATION_APPROVED_USER - Sent to user when organization is approved
 */
export class OrganizationEmailTemplatesMigration implements Migration {
  name = "023-organization-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding organization email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // Organization Approved (to User)
      {
        templateCode: EmailTemplateCode.ORGANIZATION_APPROVED_USER,
        name: "Organization Approved Notification",
        description: "Sent to user when their organization is approved",
        process: "organizationApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Organization Approved: {{title}}",
            htmlBody: `
              <h2>Great News! Your Organization is Approved</h2>
              <p>Congratulations! Your organization page has been approved and is now active.</p>
              <h3>Organization Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Organizer Name:</strong> {{organizerName}}</li>
                
              </ul>
              <p>You can now manage your organization through your dashboard.</p>
              <p>If you need any assistance, please contact us.</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Great News! Your Organization page is Approved

Congratulations! Your organization page has been approved and is now active.

Organization Details:
- Title: {{title}}
- Description: {{description}}
- Organizer Name: {{organizerName}}



If you need any assistance, please contact us.

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: ["title", "description", "organizerName"],
        isActive: true,
      },
      // Organization Rejected (to User)
      {
        templateCode: EmailTemplateCode.ORGANIZATION_REJECTED_USER,
        name: "Organization Rejected Notification",
        description: "Sent to user when their organization page is rejected",
        process: "organizationApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Organization page Rejected: {{title}}",
            htmlBody: `
              <h2>Sorry! Your Organization page Application has been Rejected</h2>
              <p>Your organization page application has been reviewed and rejected.</p>
              <h3>Organization Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Organizer Name:</strong> {{organizerName}}</li>
              </ul>
              <h3>Rejection Reason:</h3>
              <p>{{rejectionReason}}</p>
              <p>If you have any questions or need to resubmit, please contact us.</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Sorry! Your Organization page Application has been Rejected

Your organization application has been reviewed and rejected.

Organization Details:
- Title: {{title}}
- Description: {{description}}
- Organizer Name: {{organizerName}}

Rejection Reason: {{rejectionReason}}

If you have any questions or need to resubmit, please contact us.

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: ["title", "description", "organizerName", "rejectionReason"],
        isActive: true,
      },
    ];

    // Use bulkWrite for efficient upsert operations
    const bulkOps = templates.map((template) => ({
      updateOne: {
        filter: { templateCode: template.templateCode },
        update: { $set: template },
        upsert: true,
      },
    }));

    const result = await this.emailTemplateModel.bulkWrite(bulkOps);

    console.log(
      `✓ Organization email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing organization email templates...");

    const templateCodes = [
      EmailTemplateCode.ORGANIZATION_APPROVED_USER,
      EmailTemplateCode.ORGANIZATION_REJECTED_USER,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Organization email templates removed");
  }
}

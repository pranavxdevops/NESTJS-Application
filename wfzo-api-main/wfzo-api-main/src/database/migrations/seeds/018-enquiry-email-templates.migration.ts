import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for enquiry status notifications
 *
 * This migration adds 2 new email templates for enquiry approval workflow:
 * 1. ENQUIRY_APPROVED - Sent to user when their enquiry is approved
 * 2. ENQUIRY_REJECTED - Sent to user when their enquiry is rejected
 */
export class EnquiryEmailTemplatesMigration implements Migration {
  name = "018-enquiry-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding enquiry email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. Enquiry Approved
      {
        templateCode: EmailTemplateCode.ENQUIRY_APPROVED as EmailTemplateCode,
        name: "Enquiry Approved",
        description: "Sent to user when their enquiry is approved",
        process: "enquiryApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Your Enquiry Has Been Approved",
            htmlBody: `
              <h2>Enquiry Approved</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We are pleased to inform you that your enquiry has been <strong>approved</strong>.</p>
              <h3>Enquiry Details:</h3>
              <ul>
                <li><strong>Organization:</strong> {{organizationName}}</li>
                <li><strong>Enquiry Type:</strong> {{enquiryType}}</li>
                <li><strong>Status:</strong> {{status}}</li>
              </ul>
              {{#if comments}}
              <h3>Comments:</h3>
              <p>{{comments}}</p>
              {{/if}}
              <p>Our team will be in touch with you shortly to discuss the next steps.</p>
              <p>Thank you for your interest in WorldFZO!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Enquiry Approved

Hi {{firstName}} {{lastName}},

We are pleased to inform you that your enquiry has been approved.

Enquiry Details:
- Organization: {{organizationName}}
- Enquiry Type: {{enquiryType}}
- Status: {{status}}

{{#if comments}}
Comments:
{{comments}}
{{/if}}

Our team will be in touch with you shortly to discuss the next steps.

Thank you for your interest in WorldFZO!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: ["firstName", "lastName", "organizationName", "enquiryType", "status"],
        isActive: true,
      },

      // 2. Enquiry Rejected
      {
        templateCode: EmailTemplateCode.ENQUIRY_REJECTED as EmailTemplateCode,
        name: "Enquiry Rejected",
        description: "Sent to user when their enquiry is rejected",
        process: "enquiryApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Your Enquiry Status Update",
            htmlBody: `
              <h2>Enquiry Status Update</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Thank you for submitting your enquiry. After careful review, we regret to inform you that your enquiry has been <strong>rejected</strong>.</p>
              <h3>Enquiry Details:</h3>
              <ul>
                <li><strong>Organization:</strong> {{organizationName}}</li>
                <li><strong>Enquiry Type:</strong> {{enquiryType}}</li>
                <li><strong>Status:</strong> {{status}}</li>
              </ul>
              {{#if comments}}
              <h3>Feedback:</h3>
              <p>{{comments}}</p>
              {{/if}}
              <p>If you have any questions or would like to discuss this decision, please feel free to contact us at support@worldfzo.org</p>
              <p>We appreciate your understanding and hope to engage with you in the future.</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Enquiry Status Update

Hi {{firstName}} {{lastName}},

Thank you for submitting your enquiry. After careful review, we regret to inform you that your enquiry has been rejected.

Enquiry Details:
- Organization: {{organizationName}}
- Enquiry Type: {{enquiryType}}
- Status: {{status}}

{{#if comments}}
Feedback:
{{comments}}
{{/if}}

If you have any questions or would like to discuss this decision, please feel free to contact us at support@worldfzo.org

We appreciate your understanding and hope to engage with you in the future.

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: ["firstName", "lastName", "organizationName", "enquiryType", "status"],
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
      `✓ Enquiry email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing enquiry email templates...");

    const templateCodes = [EmailTemplateCode.ENQUIRY_APPROVED, EmailTemplateCode.ENQUIRY_REJECTED];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Enquiry email templates removed");
  }
}

import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for article notifications
 *
 * This migration adds 3 new email templates for article approval workflow:
 * 1. ARTICLE_SUBMITTED_FOR_APPROVAL - Sent to admin when article is submitted
 * 2. ARTICLE_APPROVED_USER - Sent to user when article is approved
 * 3. ARTICLE_REJECTED_USER - Sent to user when article is rejected
 */
export class ArticleEmailTemplatesMigration implements Migration {
  name = "019-article-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding article email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. Article Submitted for Approval (to Admin)
      {
        templateCode: EmailTemplateCode.ARTICLE_SUBMITTED_FOR_APPROVAL,
        name: "Article Submitted for Approval",
        description: "Sent to admin when a new article is submitted for approval",
        process: "articleApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "New Article Submitted for Approval: {{title}}",
            htmlBody: `
              <h2>New Article Submitted for Approval</h2>
              <p>A new article has been submitted and requires your approval.</p>
              <h3>Article Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Organizer Name:</strong> {{organizerName}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>Please review the article in the admin portal and approve or reject accordingly.</p>
              <p>Best regards,<br/>World FZO System</p>
            `,
            textBody: `New Article Submitted for Approval

A new article has been submitted and requires your approval.

Article Details:
- Title: {{title}}
- Description: {{description}}
- Organizer Name: {{organizerName}}
- Type: {{eventType}}

Please review the article in the admin portal and approve or reject accordingly.

Best regards,
World FZO System`,
          },
        ],
        requiredParams: [
           "title",
           "description",
           "category",
           "organizerName",
           "eventType",
         ],
        isActive: true,
      },

      // 2. Article Submitted (to User)
      {
        templateCode: EmailTemplateCode.ARTICLE_SUBMITTED_USER,
        name: "Article Submitted Confirmation",
        description: "Sent to user when their article is submitted",
        process: "articleApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Article Submitted Successfully: {{title}}",
            htmlBody: `
              <h2>Article Submitted Successfully</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Your article has been successfully submitted and is now under review.</p>
              <h3>Article Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>You will receive an email notification once your article is reviewed and approved or rejected.</p>
              <p>Thank you for your submission!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Article Submitted Successfully

Hi {{firstName}} {{lastName}},

Your article has been successfully submitted and is now under review.

Article Details:
- Title: {{title}}
- Description: {{description}}
- Type: {{eventType}}

You will receive an email notification once your article is reviewed and approved or rejected.

Thank you for your submission!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
           "title",
           "description",
           "category",
           "eventType",
           "firstName",
           "lastName",
         ],
        isActive: true,
      },

      // 3. Article Approved (to User)
      {
        templateCode: EmailTemplateCode.ARTICLE_APPROVED_USER,
        name: "Article Approved Notification",
        description: "Sent to user when their article is approved",
        process: "articleApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Article Approved: {{title}}",
            htmlBody: `
              <h2>Great News! Your Article is Approved</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Congratulations! Your article has been approved and is now published.</p>
              <h3>Article Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Category:</strong> {{category}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>Your article is now live and can be viewed by the community. You can manage your articles through your dashboard.</p>
              <p>If you need any assistance, please contact us at articles@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Great News! Your Article is Approved

Hi {{firstName}} {{lastName}},

Congratulations! Your article has been approved and is now published.

Article Details:
- Title: {{title}}
- Description: {{description}}
- Category: {{category}}
- Type: {{eventType}}

Your article is now live and can be viewed by the community. You can manage your articles through your dashboard.

If you need any assistance, please contact us at articles@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
           "title",
           "description",
           "category",
           "eventType",
           "firstName",
           "lastName",
         ],
        isActive: true,
      },

      // 4. Article Rejected (to User)
      {
        templateCode: EmailTemplateCode.ARTICLE_REJECTED_USER,
        name: "Article Rejected Notification",
        description: "Sent to user when their article is rejected",
        process: "articleApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Article Status Update: {{title}}",
            htmlBody: `
              <h2>Article Status Update</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We regret to inform you that your article submission has not been approved at this time.</p>
              <h3>Article Details:</h3>
              <ul>
                <li><strong>Title:</strong> {{title}}</li>
                <li><strong>Description:</strong> {{description}}</li>
                <li><strong>Category:</strong> {{category}}</li>
              </ul>
              <h3>Reason:</h3>
              <p>{{rejectionReason}}</p>
              <p>If you have any questions about this decision or would like to discuss resubmitting your article, please contact us at articles@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Article Status Update

Hi {{firstName}} {{lastName}},

We regret to inform you that your article submission has not been approved at this time.

Article Details:
- Title: {{title}}
- Description: {{description}}
- Category: {{category}}

Reason:
{{rejectionReason}}

If you have any questions about this decision or would like to discuss resubmitting your article, please contact us at articles@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
           "title",
           "description",
           "category",
           "rejectionReason",
           "firstName",
           "lastName",
         ],
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
      `✓ Article email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing article email templates...");

    const templateCodes = [
      EmailTemplateCode.ARTICLE_SUBMITTED_FOR_APPROVAL,
      EmailTemplateCode.ARTICLE_SUBMITTED_USER,
      EmailTemplateCode.ARTICLE_APPROVED_USER,
      EmailTemplateCode.ARTICLE_REJECTED_USER,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Article email templates removed");
  }
}
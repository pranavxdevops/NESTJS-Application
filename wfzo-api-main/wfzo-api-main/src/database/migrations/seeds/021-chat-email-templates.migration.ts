import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for chat message notifications
 *
 * This migration adds 2 new email templates for chat notifications:
 * 1. NEW_CHAT_MESSAGE - Sent when a user receives a message in User Chat
 * 2. NEW_CHAT_MESSAGE_MEMBER - Sent when a member receives a message in Member Chat
 */
export class ChatEmailTemplatesMigration implements Migration {
  name = "021-chat-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding chat email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. New Chat Message (User)
      {
        templateCode: EmailTemplateCode.NEW_CHAT_MESSAGE,
        name: "New Chat Message (User)",
        description: "Notification sent when a user receives a new chat message from another user",
        process: "chatNotification",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "New chat from {{senderName}}",
            htmlBody: `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Chat Message</h2>
      <p>Dear {{recipientName}},</p>
      <p>You have received a new chat message from <strong>{{senderName}}</strong> at <strong>{{senderCompany}}</strong>.</p>
      <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #333;">
        <p style="margin: 0; font-style: italic;">{{messagePreview}}</p>
      </div>
      <p><a href="{{chatUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">View Message</a></p>
      <p>Best regards,<br/>The One Zone Team</p>
    </div>
  </body>
</html>
            `,
            textBody: `Dear {{recipientName}},

You have received a new chat message from {{senderName}} at {{senderCompany}}.

Message:
{{messagePreview}}

To view and reply to this message, please visit: {{chatUrl}}

Best regards,
The One Zone Team`,
          },
        ],
        requiredParams: [
          "recipientName",
          "senderName",
          "senderCompany",
          "messagePreview",
          "chatUrl",
        ],
        isActive: true,
      },

      // 2. New Chat Message (Member)
      {
        templateCode: EmailTemplateCode.NEW_CHAT_MESSAGE_MEMBER,
        name: "New Chat Message (Member)",
        description: "Notification sent when a member receives a new chat message from another member",
        process: "chatNotification",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "New chat from {{senderCompany}}",
            htmlBody: `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Member Chat Message</h2>
      <p>Dear {{recipientName}},</p>
      <p>You have received a new chat message from <strong>{{senderCompany}}</strong>.</p>
      <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #333;">
        <p style="margin: 0; font-style: italic;">{{messagePreview}}</p>
      </div>
      <p><a href="{{chatUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px;">View Message</a></p>
      <p>Best regards,<br/>The One Zone Team</p>
    </div>
  </body>
</html>
            `,
            textBody: `Dear {{recipientName}},

You have received a new chat message from {{senderCompany}}.

Message:
{{messagePreview}}

To view and reply to this message, please visit: {{chatUrl}}

Best regards,
The One Zone Team`,
          },
        ],
        requiredParams: [
          "recipientName",
          "senderCompany",
          "messagePreview",
          "chatUrl",
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
      `✓ Chat email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing chat email templates...");

    const templateCodes = [
      EmailTemplateCode.NEW_CHAT_MESSAGE,
      EmailTemplateCode.NEW_CHAT_MESSAGE_MEMBER,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Chat email templates removed");
  }
}

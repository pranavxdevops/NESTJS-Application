import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for event notifications
 *
 * This migration adds 6 new email templates for event approval workflow:
 * 1. EVENT_SUBMITTED_FOR_APPROVAL - Sent to admin when event is submitted
 * 2. EVENT_SUBMITTED_USER - Sent to user when event is submitted
 * 3. EVENT_APPROVED_USER - Sent to user when event is approved
 * 4. EVENT_REJECTED_USER - Sent to user when event is rejected
 * 5. EVENT_APPROVED_ADMIN - Sent to admin when event is approved
 * 6. EVENT_REJECTED_ADMIN - Sent to admin when event is rejected
 */
export class EventEmailTemplatesMigration implements Migration {
  name = "017-event-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding event email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. Event Submitted for Approval (to Admin)
      {
        templateCode: EmailTemplateCode.EVENT_SUBMITTED_FOR_APPROVAL,
        name: "Event Submitted for Approval",
        description: "Sent to admin when a new event is submitted for approval",
        process: "eventApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "New Event Submitted for Approval: {{eventTitle}}",
            htmlBody: `
              <h2>New Event Submitted for Approval</h2>
              <p>A new event has been submitted and requires your approval.</p>
              <h3>Event Details:</h3>
              <ul>
                <li><strong>Event Title:</strong> {{eventTitle}}</li>
                <li><strong>Organizer Name:</strong> {{organizerName}}</li>
                <li><strong>Scheduled Date:</strong> {{scheduledDate}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>Please review the event in the admin portal and approve or reject accordingly.</p>
              <p>Best regards,<br/>World FZO System</p>
            `,
            textBody: `New Event Submitted for Approval

A new event has been submitted and requires your approval.

Event Details:
- Event Title: {{eventTitle}}
- Organizer Name: {{organizerName}}
- Scheduled Date: {{scheduledDate}}
- Type: {{eventType}}
Please review the event in the admin portal and approve or reject accordingly.

Best regards,
World FZO System`,
          },
        ],
        requiredParams: [
          "eventTitle",
          "scheduledDate",
          "eventType",
          "organizerName",
        ],
        isActive: true,
      },

      // 2. Event Submitted (to User)
      {
        templateCode: EmailTemplateCode.EVENT_SUBMITTED_USER,
        name: "Event Submitted Confirmation",
        description: "Sent to user when their event is submitted",
        process: "eventApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Event Submitted Successfully: {{eventTitle}}",
            htmlBody: `
              <h2>Event Submitted Successfully</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Your event has been successfully submitted and is now under review.</p>
              <h3>Event Details:</h3>
              <ul>
              
                <li><strong>Event Title:</strong> {{eventTitle}}</li>
                <li><strong>Scheduled Date:</strong> {{scheduledDate}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>You will receive an email notification once your event is reviewed and approved or rejected.</p>
              <p>Thank you for your submission!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Event Submitted Successfully

Hi {{firstName}} {{lastName}},

Your event has been successfully submitted and is now under review.

Event Details:
- Event Title: {{eventTitle}}
- Scheduled Date: {{scheduledDate}}
- Type: {{eventType}}

You will receive an email notification once your event is reviewed and approved or rejected.

Thank you for your submission!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "eventTitle",
          "scheduledDate",
          "eventType",
          "firstName",
          "lastName",
        ],
        isActive: true,
      },

      // 3. Event Approved (to User)
      {
        templateCode: EmailTemplateCode.EVENT_APPROVED_USER,
        name: "Event Approved Notification",
        description: "Sent to user when their event is approved",
        process: "eventApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Event Approved: {{eventTitle}}",
            htmlBody: `
              <h2>Great News! Your {{eventType}} is Approved</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Congratulations! Your {{eventType}} has been approved and is now scheduled.</p>
              <h3>Event Details:</h3>
              <ul>
                <li><strong>Event Title:</strong> {{eventTitle}}</li>
                <li><strong>Scheduled Date:</strong> {{scheduledDate}}</li>
                <li><strong>Type:</strong> {{eventType}}</li>
              </ul>
              <p>Your event is now live and attendees can register. You can manage the event through your dashboard.</p>
              <p>If you need any assistance, please contact us at events@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Great News! Your {{eventType}} is Approved

Hi {{firstName}} {{lastName}},

Congratulations! Your {{eventType}} has been approved and is now scheduled.

Event Details:
- EventTitle: {{eventTitle}}
- Scheduled Date: {{scheduledDate}}
- Type: {{eventType}}

Your event is now live and attendees can register. You can manage the event through your dashboard.

If you need any assistance, please contact us at events@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "eventTitle",
          "scheduledDate",
          "eventType",
          "firstName",
          "lastName",
        ],
        isActive: true,
      },

      // 4. Event Rejected (to User)
      {
        templateCode: EmailTemplateCode.EVENT_REJECTED_USER,
        name: "Event Rejected Notification",
        description: "Sent to user when their event is rejected",
        process: "eventApproval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Event Status Update: {{eventTitle}}",
            htmlBody: `
              <h2>Event Status Update</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We regret to inform you that your event submission has not been approved at this time.</p>
              <h3>Event Details:</h3>
              <ul>
                <li><strong>Event Title:</strong> {{eventTitle}}</li>
                <li><strong>Scheduled Date:</strong> {{scheduledDate}}</li>
              </ul>
              <h3>Reason:</h3>
              <p>{{rejectionReason}}</p>
              <p>If you have any questions about this decision or would like to discuss resubmitting your event, please contact us at events@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Event Status Update

Hi {{firstName}} {{lastName}},

We regret to inform you that your event submission has not been approved at this time.

Event Details:
- Event Title: {{eventTitle}}
- Scheduled Date: {{scheduledDate}}

Reason:
{{rejectionReason}}

If you have any questions about this decision or would like to discuss resubmitting your event, please contact us at events@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "eventTitle",
          "scheduledDate",
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
      `✓ Event email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing event email templates...");

    const templateCodes = [
      EmailTemplateCode.EVENT_SUBMITTED_FOR_APPROVAL,
      EmailTemplateCode.EVENT_SUBMITTED_USER,
      EmailTemplateCode.EVENT_APPROVED_USER,
      EmailTemplateCode.EVENT_REJECTED_USER,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Event email templates removed");
  }
}
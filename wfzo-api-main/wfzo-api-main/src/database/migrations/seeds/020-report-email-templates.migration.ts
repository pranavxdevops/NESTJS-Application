import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for member report notifications
 *
 * This migration adds 2 new email templates for member reporting:
 * 1. MEMBER_REPORT_ADMIN - Sent to admin when a member/user is reported
 * 2. MEMBER_REPORT_CONFIRMATION - Sent to reporter confirming their report
 */
export class ReportEmailTemplatesMigration implements Migration {
  name = "020-report-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding report email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. Member Report Admin Notification
      {
        templateCode: EmailTemplateCode.MEMBER_REPORT_ADMIN,
        name: "Member Report - Admin Notification",
        description: "Sent to admin when a member or user is reported",
        process: "memberReport",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "🚨 Member Report - {{reportedCompany}}",
            htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #495057; }
    .value { margin-left: 10px; }
    .reason-box { background: white; padding: 15px; border-left: 4px solid #dc3545; margin-top: 10px; }
    .footer { margin-top: 20px; padding: 10px; background-color: #e9ecef; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 New Member Report</h2>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>Reporter Information</h3>
        <p><span class="label">Member ID:</span> <span class="value">{{reporterMemberId}}</span></p>
        <p><span class="label">Company:</span> <span class="value">{{reporterCompany}}</span></p>
        <p><span class="label">User:</span> <span class="value">{{reporterName}} ({{reporterEmail}})</span></p>
      </div>

      <div class="section">
        <h3>Reported Party</h3>
        <p><span class="label">Member ID:</span> <span class="value">{{reportedMemberId}}</span></p>
        <p><span class="label">Company:</span> <span class="value">{{reportedCompany}}</span></p>
        {{#if reportedUserName}}
        <p><span class="label">User:</span> <span class="value">{{reportedUserName}}</span></p>
        {{else}}
        <p><em>Organization-level report (no specific user)</em></p>
        {{/if}}
      </div>

      <div class="section">
        <h3>Reason for Report</h3>
        <div class="reason-box">{{reason}}</div>
      </div>

      <div class="section">
        <p><span class="label">Timestamp:</span> <span class="value">{{timestamp}}</span></p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated report from WFZO platform</p>
      <p>You can reply to this email to contact the reporter directly</p>
    </div>
  </div>
</body>
</html>
            `,
            textBody: `
🚨 NEW MEMBER REPORT

REPORTER INFORMATION:
- Member ID: {{reporterMemberId}}
- Company: {{reporterCompany}}
- User: {{reporterName}} ({{reporterEmail}})

REPORTED PARTY:
- Member ID: {{reportedMemberId}}
- Company: {{reportedCompany}}
{{#if reportedUserName}}
- User: {{reportedUserName}}
{{else}}
- Organization-level report (no specific user)
{{/if}}

REASON FOR REPORT:
{{reason}}

Timestamp: {{timestamp}}

---
This is an automated report from WFZO platform.
You can reply to this email to contact the reporter directly.
            `,
          },
        ],
        requiredParams: [
          "reporterMemberId",
          "reporterCompany",
          "reporterName",
          "reporterEmail",
          "reportedMemberId",
          "reportedCompany",
          "reportedUserName",
          "reportType",
          "reason",
          "timestamp",
        ],
        isActive: true,
      },

      // 2. Member Report Confirmation (to Reporter)
      {
        templateCode: EmailTemplateCode.MEMBER_REPORT_CONFIRMATION,
        name: "Member Report - Reporter Confirmation",
        description: "Sent to reporter confirming their report was submitted",
        process: "memberReport",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "WFZO Platform - Report Confirmation",
            htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
    .footer { margin-top: 20px; padding: 15px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d; }
    .confirmation-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Report Submitted Successfully</h2>
    </div>
    
    <div class="content">
      <p>Dear {{reporterName}},</p>
      
      <div class="confirmation-box">
        <strong>✓ Your report has been received and forwarded to WFZO admin team.</strong>
      </div>
      
      <p>Thank you for bringing this matter to our attention. We take all reports seriously and will review this case carefully.</p>
      
      <div class="details">
        <h3>Report Details:</h3>
        <p><strong>Report Type:</strong> {{reportType}} Report</p>
        <p><strong>Reported {{reportType}}:</strong> {{reportedName}}</p>
        {{#if reportedCompany}}
        <p><strong>Organization:</strong> {{reportedCompany}}</p>
        {{/if}}
        <p><strong>Submitted:</strong> {{timestamp}}</p>
        <p><strong>Status:</strong> Under Review</p>
      </div>
      
      <p>Our team will investigate this matter and take appropriate action if necessary. You may be contacted if we need additional information.</p>
      
      <p>We are committed to maintaining a safe and professional environment for all WFZO members.</p>
      
      <p>Best regards,<br/>
      <strong>WFZO Admin Team</strong></p>
    </div>

    <div class="footer">
      <p>This is an automated confirmation from WFZO Platform</p>
      <p>For inquiries, contact: {{adminEmail}}</p>
    </div>
  </div>
</body>
</html>
            `,
            textBody: `
WFZO Platform - Report Confirmation

Dear {{reporterName}},

✓ Your report has been received and forwarded to WFZO admin team.

Thank you for bringing this matter to our attention. We take all reports seriously and will review this case carefully.

Report Details:
- Report Type: {{reportType}} Report
- Reported {{reportType}}: {{reportedName}}
{{#if reportedCompany}}
- Organization: {{reportedCompany}}
{{/if}}
- Submitted: {{timestamp}}
- Status: Under Review

Our team will investigate this matter and take appropriate action if necessary. You may be contacted if we need additional information.

We are committed to maintaining a safe and professional environment for all WFZO members.

Best regards,
WFZO Admin Team

---
This is an automated confirmation from WFZO Platform.
For inquiries, contact: {{adminEmail}}
            `,
          },
        ],
        requiredParams: [
          "reporterName",
          "reportType",
          "reportedName",
          "reportedCompany",
          "timestamp",
          "adminEmail",
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
      `✓ Report email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing report email templates...");

    const templateCodes = [
      EmailTemplateCode.MEMBER_REPORT_ADMIN,
      EmailTemplateCode.MEMBER_REPORT_CONFIRMATION,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Report email templates removed");
  }
}

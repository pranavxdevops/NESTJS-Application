import { Migration } from '../migration.interface';
import { Model } from 'mongoose';
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from '../../../shared/email/schemas/email-template.schema';

export class ConnectionEmailTemplatesMigration implements Migration {
  name = '022-connection-email-templates';

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log('Seeding connection email templates...');

    const templates: Partial<EmailTemplate>[] = [
      {
        templateCode: EmailTemplateCode.CONNECTION_REQUEST_RECEIVED,
        name: 'Connection Request Received',
        description: 'Email sent to member when they receive a new connection request',
        process: 'connectionNotification',
        requiredParams: [
          'recipientName',
          'requesterName',
          'requesterCompany',
          'requesterMemberId',
        ],
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: 'New Connection Request from {{requesterName}}',
            htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
    .requester-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0066cc; }
    .note-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button.secondary { background-color: #6c757d; }
    .footer { margin-top: 20px; padding: 15px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🤝 New Connection Request</h2>
    </div>
    <div class="content">
      <p>Dear {{recipientName}},</p>
      
      <p>You have received a new connection request on the WFZO platform!</p>
      
      <div class="requester-info">
        <h3>Connection Request From:</h3>
        <p><strong>Name:</strong> {{requesterName}}</p>
        <p><strong>Company:</strong> {{requesterCompany}}</p>
        <p><strong>Member ID:</strong> {{requesterMemberId}}</p>
      </div>
      
      <p>You can accept or reject this connection request from your WFZO dashboard.</p>
      
      <p>Best regards,<br/>
      <strong>WFZO Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification from WFZO Platform</p>
      <p>© 2026 WFZO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
            textBody: `WFZO Platform - New Connection Request

Dear {{recipientName}},

You have received a new connection request on the WFZO platform!

CONNECTION REQUEST FROM:
- Name: {{requesterName}}
- Company: {{requesterCompany}}
- Member ID: {{requesterMemberId}}

You can accept or reject this connection request from your WFZO dashboard.

Best regards,
WFZO Team

---
This is an automated notification from WFZO Platform.
© 2026 WFZO. All rights reserved.`,
          },
        ],
        isActive: true,
      },
      {
        templateCode: EmailTemplateCode.CONNECTION_REQUEST_ACCEPTED,
        name: 'Connection Request Accepted',
        description: 'Email sent to requester when their connection request is accepted',
        process: 'connectionNotification',
        requiredParams: [
          'requesterName',
          'recipientName',
          'recipientCompany',
          'recipientMemberId',
        ],
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: '{{recipientName}} accepted your connection request',
            htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; text-align: center; }
    .member-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { margin-top: 20px; padding: 15px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d; }
    .icon { font-size: 48px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Connection Request Accepted!</h2>
    </div>
    <div class="content">
      <p>Dear {{requesterName}},</p>
      
      <div class="success-box">
        <div class="icon">🎉</div>
        <h3>Great news!</h3>
        <p>Your connection request has been accepted.</p>
      </div>
      
      <div class="member-info">
        <h3>You are now connected with:</h3>
        <p><strong>Name:</strong> {{recipientName}}</p>
        <p><strong>Company:</strong> {{recipientCompany}}</p>
        <p><strong>Member ID:</strong> {{recipientMemberId}}</p>
      </div>
      
      <p>You can now start messaging and collaborating with {{recipientName}} on the WFZO platform.</p>
      
      <p>Build meaningful business relationships and grow together on WFZO!</p>
      
      <p>Best regards,<br/>
      <strong>WFZO Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification from WFZO Platform</p>
      <p>© 2026 WFZO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
            textBody: `WFZO Platform - Connection Request Accepted

Dear {{requesterName}},

🎉 Great news! Your connection request has been accepted.

YOU ARE NOW CONNECTED WITH:
- Name: {{recipientName}}
- Company: {{recipientCompany}}
- Member ID: {{recipientMemberId}}

You can now start messaging and collaborating with {{recipientName}} on the WFZO platform.

Build meaningful business relationships and grow together on WFZO!

Best regards,
WFZO Team

---
This is an automated notification from WFZO Platform.
© 2026 WFZO. All rights reserved.`,
          },
        ],
        isActive: true,
      },
    ];

    // Upsert templates
    for (const template of templates) {
      await this.emailTemplateModel.findOneAndUpdate(
        { templateCode: template.templateCode },
        { $set: template },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Connection email templates created successfully');
  }

  async down(): Promise<void> {
    await this.emailTemplateModel.deleteMany({
      templateCode: {
        $in: [
          EmailTemplateCode.CONNECTION_REQUEST_RECEIVED,
          EmailTemplateCode.CONNECTION_REQUEST_ACCEPTED,
        ],
      },
    });
    console.log('✅ Connection email templates removed');
  }
}

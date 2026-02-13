import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  EmailTemplate,
  EmailTemplateCode,
  SupportedLanguage,
} from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed email templates for member onboarding workflow
 *
 * This migration adds 7 new email templates for the complete member onboarding workflow:
 * 1. MEMBER_PHASE1_CONFIRMATION - Sent after Phase 1 submission
 * 2. MEMBER_PHASE2_CONFIRMATION - Sent to member after Phase 2 submission
 * 3. MEMBER_PHASE2_ADMIN_NOTIFICATION - Sent to admin after Phase 2 submission
 * 4. MEMBER_APPROVAL - Sent when application is approved at any stage
 * 5. MEMBER_REJECTION - Sent when application is rejected
 * 6. MEMBER_PAYMENT_LINK - Sent with payment link after CEO approval
 * 7. MEMBER_WELCOME - Sent after payment completion and membership activation
 */
export class WorkflowEmailTemplatesMigration implements Migration {
  name = "014-workflow-email-templates";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding workflow email templates...");

    const templates: Partial<EmailTemplate>[] = [
      // 1. Phase 1 Confirmation Email
      {
        templateCode: EmailTemplateCode.MEMBER_PHASE1_CONFIRMATION,
        name: "Member Phase 1 Confirmation",
        description: "Sent to applicant after Phase 1 submission with link to complete Phase 2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Welcome to World FZO - Complete Your Application",
            htmlBody: `
              <h2>Welcome to World FZO!</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Thank you for initiating your membership application with World FZO.</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <p>Your initial application has been received. To complete your membership application, please proceed to Phase 2:</p>
              <p><a href="{{phase2Url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Application</a></p>
              <p>Please complete Phase 2 within 30 days to avoid application expiration.</p>
              <p>If you have any questions, please contact us at membership@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Welcome to World FZO!

Hi {{firstName}} {{lastName}},

Thank you for initiating your membership application with World FZO.

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

Your initial application has been received. To complete your membership application, please visit:
{{phase2Url}}

Please complete Phase 2 within 30 days to avoid application expiration.

If you have any questions, please contact us at membership@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "applicationNumber",
          "memberId",
          "companyName",
          "phase2Url",
          "firstName",
          "lastName",
        ],
        isActive: true,
      },

      // 2. Phase 2 Confirmation Email
      {
        templateCode: EmailTemplateCode.MEMBER_PHASE2_CONFIRMATION,
        name: "Member Phase 2 Confirmation",
        description: "Sent to applicant after Phase 2 submission confirming receipt",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Application Submitted - Under Review",
            htmlBody: `
              <h2>Application Submitted Successfully</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Your membership application has been successfully submitted and is now under review.</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <h3>Next Steps:</h3>
              <ol>
                <li>Your application will be reviewed by our Membership Committee</li>
                <li>If approved, it will proceed to the Membership Board</li>
                <li>Final approval will be provided by our CEO</li>
              </ol>
              <p>You will receive email notifications at each stage of the approval process.</p>
              <p>Thank you for your interest in World FZO membership!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Application Submitted Successfully

Hi {{firstName}} {{lastName}},

Your membership application has been successfully submitted and is now under review.

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

Next Steps:
1. Your application will be reviewed by our Membership Committee
2. If approved, it will proceed to the Membership Board
3. Final approval will be provided by our CEO

You will receive email notifications at each stage of the approval process.

Thank you for your interest in World FZO membership!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: ["applicationNumber", "memberId", "companyName", "firstName", "lastName"],
        isActive: true,
      },

      // 3. Phase 2 Admin Notification
      {
        templateCode: EmailTemplateCode.MEMBER_PHASE2_ADMIN_NOTIFICATION,
        name: "Phase 2 Admin Notification",
        description: "Sent to admin when new application is submitted for review",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "New Membership Application: {{companyName}}",
            htmlBody: `
              <h2>New Membership Application Received</h2>
              <p>A new membership application has been submitted and requires review.</p>
              <h3>Application Details:</h3>
              <ul>
                <li><strong>Application Number:</strong> {{applicationNumber}}</li>
                <li><strong>Member ID:</strong> {{memberId}}</li>
                <li><strong>Company:</strong> {{companyName}}</li>
                <li><strong>Category:</strong> {{category}}</li>
              </ul>
              <p>Please review the application in the admin portal.</p>
              <p>Best regards,<br/>World FZO System</p>
            `,
            textBody: `New Membership Application Received

A new membership application has been submitted and requires review.

Application Details:
- Application Number: {{applicationNumber}}
- Member ID: {{memberId}}
- Company: {{companyName}}
- Category: {{category}}

Please review the application in the admin portal.

Best regards,
World FZO System`,
          },
        ],
        requiredParams: ["applicationNumber", "memberId", "companyName", "category"],
        isActive: true,
      },

      // 4. Approval Email
      {
        templateCode: EmailTemplateCode.MEMBER_APPROVAL,
        name: "Member Approval Notification",
        description: "Sent when application is approved at any stage",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Application Approved - {{approvalStage}}",
            htmlBody: `
              <h2>Great News!</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Your membership application has been approved at the {{approvalStage}} stage.</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Member ID:</strong> {{memberId}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <p>Your application is progressing through our approval workflow. You will receive further updates as it moves to the next stage.</p>
              <p>Thank you for your patience!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Great News!

Hi {{firstName}} {{lastName}},

Your membership application has been approved at the {{approvalStage}} stage.

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

Your application is progressing through our approval workflow. You will receive further updates as it moves to the next stage.

Thank you for your patience!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "applicationNumber",
          "memberId",
          "companyName",
          "approvalStage",
          "firstName",
          "lastName",
        ],
        isActive: true,
      },

      // 5. Rejection Email
      {
        templateCode: EmailTemplateCode.MEMBER_REJECTION,
        name: "Member Rejection Notification",
        description: "Sent when application is rejected",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Application Status Update",
            htmlBody: `
              <h2>Application Status Update</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We regret to inform you that your membership application has not been approved at this time.</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Member ID:</strong> {{memberId}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <h3>Reason:</h3>
              <p>{{rejectionReason}}</p>
              <p>If you have any questions about this decision or would like to discuss your application further, please contact us at membership@worldfzo.org</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Application Status Update

Hi {{firstName}} {{lastName}},

We regret to inform you that your membership application has not been approved at this time.

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

Reason:
{{rejectionReason}}

If you have any questions about this decision or would like to discuss your application further, please contact us at membership@worldfzo.org

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "applicationNumber",
          "memberId",
          "companyName",
          "rejectionReason",
          "firstName",
          "lastName",
        ],
        isActive: true,
      },

      // 6. Payment Link Email
      {
        templateCode: EmailTemplateCode.MEMBER_PAYMENT_LINK,
        name: "Payment Link",
        description: "Sent with payment link after CEO approval",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Complete Your Membership Payment - World FZO",
            htmlBody: `
              <h2>Congratulations! Your Application is Approved</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We are pleased to inform you that your membership application has been approved!</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Member ID:</strong> {{memberId}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <p>To activate your membership, please complete the payment using the link below:</p>
              <p><a href="{{paymentLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a></p>
              <p>Once payment is received, your membership will be activated and you will receive your welcome package with login credentials.</p>
              <p>If you wish to proceed with a bank transfer, please transfer the amount to the account details below.</p>
              <p><strong>Bank details:</strong><br/>
              Account name: {{accountHolder}}<br/>
              Account number: {{accountNumber}}<br/>
              IBAN: {{iban}}</p>
              <p>After the transfer, please share the transaction reference with us at accounts@worldfzo.org. Please note that member login details will be received only once transaction reference is shared.</p>
              <p>If you have any questions about the payment process, please contact us at membership@worldfzo.org</p>
              <p>We look forward to welcoming you as a member!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Congratulations! Your Application is Approved

Hi {{firstName}} {{lastName}},

We are pleased to inform you that your membership application has been approved!

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

To activate your membership, please complete the payment using this link:
{{paymentLink}}

Once payment is received, your membership will be activated and you will receive your welcome package with login credentials.

If you wish to proceed with a bank transfer, please transfer the amount to the account details below.

Bank details:
Account name: {{accountHolder}}
Account number: {{accountNumber}}
IBAN: {{iban}}

After the transfer, please share the transaction reference with us at accounts@worldfzo.org. Please note that member login details will be received only once transaction reference is shared.

If you have any questions about the payment process, please contact us at membership@worldfzo.org

We look forward to welcoming you as a member!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "applicationNumber",
          "memberId",
          "companyName",
          "paymentLink",
          "firstName",
          "lastName",
          "accountNumber",
          "accountHolder",
          "iban",
        ],
        isActive: true,
      },

      // 7. Welcome Email
      {
        templateCode: EmailTemplateCode.MEMBER_WELCOME,
        name: "Welcome Email with Credentials",
        description: "Sent after payment completion and membership activation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Welcome to World FZO!",
            htmlBody: `
              <h2>Welcome to World FZO!</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Congratulations! Your membership with World FZO is now active.</p>
              <p><strong>Member ID:</strong> {{memberId}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <h3>Your Account Details:</h3>
              <ul>
                <li><strong>Email/Username:</strong> {{userEmail}}</li>
                <li><strong>Temporary Password:</strong> {{temporaryPassword}}</li>
                <li><strong>Login URL:</strong> <a href="{{frontendBaseUrl}}">{{frontendBaseUrl}}</a></li>
              </ul>
              <p>You can log in using the temporary password provided above. Once you sign in, we strongly recommend resetting your password for security purposes.</p>
              <h3>What's Next?</h3>
              <ul>
                <li>Access exclusive member resources and benefits</li>
                <li>Connect with other free zone organizations worldwide</li>
                <li>Participate in World FZO events and webinars</li>
                <li>Access training and consulting services</li>
              </ul>
              <p>If you need any assistance getting started, please don't hesitate to reach out to our member support team at support@worldfzo.org</p>
              <p>We are excited to have you as part of the World FZO community!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
            textBody: `Welcome to World FZO!

Dear {{firstName}} {{lastName}},

Congratulations! Your membership with World FZO is now active.

Member ID: {{memberId}}
Company: {{companyName}}

Your Account Details:
- Email/Username: {{userEmail}}
- Temporary Password : {{temporaryPassword}}
- Login URL: {{frontendBaseUrl}}

You can log in using the temporary password provided above. Once you sign in, we strongly recommend resetting your password for security purposes.

What's Next?
- Access exclusive member resources and benefits
- Connect with other free zone organizations worldwide
- Participate in World FZO events and webinars
- Access training and consulting services

If you need any assistance getting started, please don't hesitate to reach out to our member support team at support@worldfzo.org

We are excited to have you as part of the World FZO community!

Best regards,
World FZO Team`,
          },
        ],
        requiredParams: [
          "applicationNumber",
          "memberId",
          "companyName",
          "userEmail",
          "firstName",
          "lastName",
          "temporaryPassword",
          "frontendBaseUrl",
        ],
        isActive: true,
      },

      // 8. Internal User Credentials Email
      {
        templateCode: EmailTemplateCode.INTERNAL_USER_CREDENTIALS,
        name: "Internal User Credentials",
        description: "Sent to newly created internal users with their login credentials",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            subject: "Your World FZO Admin Account Credentials",
            htmlBody: `
              <h2>Welcome to World FZO Admin Portal</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>Your internal user account has been created successfully.</p>
              <h3>Your Account Details:</h3>
              <ul>
                <li><strong>Email/Username:</strong> {{userEmail}}</li>
                <li><strong>Temporary Password:</strong> {{temporaryPassword}}</li>
                <li><strong>Assigned Roles:</strong> {{userRoles}}</li>
                <li><strong>Login URL:</strong> <a href="{{adminPortalUrl}}">{{adminPortalUrl}}</a></li>
              </ul>
              <p><strong>Important:</strong> This is a temporary password. You will be required to change it upon first login for security purposes.</p>
              <h3>Getting Started:</h3>
              <ol>
                <li>Visit the admin portal using the link above</li>
                <li>Log in with your email and temporary password</li>
                <li>Change your password when prompted</li>
                <li>Review your assigned roles and permissions</li>
              </ol>
              <p>If you have any questions or need assistance, please contact the system administrator.</p>
              <p>Best regards,<br/>World FZO Admin Team</p>
            `,
            textBody: `Welcome to World FZO Admin Portal

Hi {{firstName}} {{lastName}},

Your internal user account has been created successfully.

Your Account Details:
- Email/Username: {{userEmail}}
- Temporary Password: {{temporaryPassword}}
- Assigned Roles: {{userRoles}}
- Login URL: {{adminPortalUrl}}

Important: This is a temporary password. You will be required to change it upon first login for security purposes.

Getting Started:
1. Visit the admin portal using the link above
2. Log in with your email and temporary password
3. Change your password when prompted
4. Review your assigned roles and permissions

If you have any questions or need assistance, please contact the system administrator.

Best regards,
World FZO Admin Team`,
          },
        ],
        requiredParams: [
          "userEmail",
          "firstName",
          "lastName",
          "temporaryPassword",
          "userRoles",
          "adminPortalUrl",
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
      `✓ Workflow email templates migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing workflow email templates...");

    const templateCodes = [
      EmailTemplateCode.MEMBER_PHASE1_CONFIRMATION,
      EmailTemplateCode.MEMBER_PHASE2_CONFIRMATION,
      EmailTemplateCode.MEMBER_PHASE2_ADMIN_NOTIFICATION,
      EmailTemplateCode.MEMBER_APPROVAL,
      EmailTemplateCode.MEMBER_REJECTION,
      EmailTemplateCode.MEMBER_PAYMENT_LINK,
      EmailTemplateCode.MEMBER_WELCOME,
      EmailTemplateCode.INTERNAL_USER_CREDENTIALS,
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Workflow email templates removed");
  }
}

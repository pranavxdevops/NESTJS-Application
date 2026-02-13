import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { EmailTemplate } from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration: Seed initial email templates
 */
export class EmailTemplatesSeedMigration implements Migration {
  name = "013-email-templates-seed";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Seeding email templates...");

    const templates = [
      {
        templateCode: "MEMBER_REGISTRATION_CONFIRMATION",
        name: "Member Registration Confirmation",
        description: "Sent when a member completes the registration form",
        translations: [
          {
            language: "en",
            subject: "Welcome to World FZO - Registration Received",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0066cc;">Welcome to World FZO!</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>Thank you for registering with World FZO. We have received your application for <strong>{{membershipType}}</strong> membership.</p>
                    <p>Your application is now under review. We will notify you once the review process is complete.</p>
                    <p><strong>Registration Details:</strong></p>
                    <ul>
                      <li>Organization: {{organizationName}}</li>
                      <li>Contact Person: {{contactName}}</li>
                      <li>Email: {{contactEmail}}</li>
                      <li>Registration Date: {{registrationDate}}</li>
                    </ul>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nThank you for registering with World FZO. We have received your application for {{membershipType}} membership.",
          },
        ],
        requiredParams: [
          "organizationName",
          "membershipType",
          "contactName",
          "contactEmail",
          "registrationDate",
        ],
        isActive: true,
      },
      {
        templateCode: "MEMBER_APPROVAL_PENDING",
        name: "Member Approval Pending",
        description: "Sent when member application is under review",
        translations: [
          {
            language: "en",
            subject: "World FZO Membership Application - Under Review",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ffc107;">Application Under Review</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>Your World FZO membership application is currently under review by our team.</p>
                    <p><strong>Application Details:</strong></p>
                    <ul>
                      <li>Application ID: {{applicationId}}</li>
                      <li>Membership Type: {{membershipType}}</li>
                      <li>Submitted Date: {{submittedDate}}</li>
                      <li>Expected Review Completion: {{expectedDate}}</li>
                    </ul>
                    <p>We will notify you as soon as the review is complete.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nYour World FZO membership application is under review. Application ID: {{applicationId}}",
          },
        ],
        requiredParams: [
          "organizationName",
          "applicationId",
          "membershipType",
          "submittedDate",
          "expectedDate",
        ],
        isActive: true,
      },
      {
        templateCode: "MEMBER_APPROVED",
        name: "Member Application Approved",
        description: "Sent when a member application is approved",
        translations: [
          {
            language: "en",
            subject: "Congratulations! Your World FZO Membership has been Approved",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">Membership Approved!</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>We are pleased to inform you that your application for <strong>{{membershipType}}</strong> membership has been <strong>approved</strong>!</p>
                    <p><strong>Approval Details:</strong></p>
                    <ul>
                      <li>Member ID: {{memberId}}</li>
                      <li>Approval Date: {{approvalDate}}</li>
                      <li>Approved By: {{approvedBy}}</li>
                      <li>Membership Valid Until: {{validUntil}}</li>
                    </ul>
                    <p>Welcome to the World FZO community! You will receive your login credentials in a separate email.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nCongratulations! Your membership has been approved. Member ID: {{memberId}}",
          },
        ],
        requiredParams: [
          "organizationName",
          "membershipType",
          "memberId",
          "approvalDate",
          "approvedBy",
          "validUntil",
        ],
        isActive: true,
      },
      {
        templateCode: "MEMBER_REJECTED",
        name: "Member Application Rejected",
        description: "Sent when a member application is rejected",
        translations: [
          {
            language: "en",
            subject: "World FZO Membership Application Status",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545;">Application Status Update</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>Thank you for your interest in joining World FZO. After careful review, we regret to inform you that we are unable to approve your membership application at this time.</p>
                    <p><strong>Reason:</strong></p>
                    <p>{{rejectionReason}}</p>
                    <p><strong>Next Steps:</strong></p>
                    <p>{{nextSteps}}</p>
                    <p>If you have any questions or would like to discuss this decision, please feel free to contact us at {{contactEmail}}.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nThank you for your interest in joining World FZO. We regret to inform you that your application cannot be approved at this time.\n\nReason: {{rejectionReason}}",
          },
        ],
        requiredParams: ["organizationName", "rejectionReason", "nextSteps", "contactEmail"],
        isActive: true,
      },
      {
        templateCode: "MEMBER_CREDENTIALS",
        name: "Member Login Credentials",
        description: "Sent when member account credentials are created",
        translations: [
          {
            language: "en",
            subject: "Your World FZO Account Credentials",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0066cc;">Your Account Credentials</h2>
                    <p>Dear {{userName}},</p>
                    <p>Your World FZO member account has been created. Below are your login credentials:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
                      <p><strong>Username:</strong> {{username}}</p>
                      <p><strong>Temporary Password:</strong> {{password}}</p>
                      <p><strong>Member ID:</strong> {{memberId}}</p>
                      <p><strong>Login URL:</strong> <a href="{{loginUrl}}">{{loginUrl}}</a></p>
                    </div>
                    <p style="color: #dc3545;"><strong>Important:</strong> Please change your password upon first login for security purposes.</p>
                    <p>If you did not request this account, please contact us immediately at {{supportEmail}}.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{userName}},\n\nYour World FZO account credentials:\n\nUsername: {{username}}\nTemporary Password: {{password}}\nMember ID: {{memberId}}\nLogin URL: {{loginUrl}}\n\nPlease change your password upon first login.",
          },
        ],
        requiredParams: [
          "userName",
          "username",
          "password",
          "memberId",
          "loginUrl",
          "supportEmail",
        ],
        isActive: true,
      },
      {
        templateCode: "MEMBERSHIP_RENEWAL_REMINDER",
        name: "Membership Renewal Reminder",
        description: "Sent to remind members about upcoming membership renewal",
        translations: [
          {
            language: "en",
            subject: "World FZO Membership Renewal Reminder",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ff9800;">Membership Renewal Reminder</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>This is a friendly reminder that your World FZO membership will expire soon.</p>
                    <p><strong>Membership Details:</strong></p>
                    <ul>
                      <li>Member ID: {{memberId}}</li>
                      <li>Current Expiry Date: {{expiryDate}}</li>
                      <li>Days Remaining: {{daysRemaining}}</li>
                      <li>Membership Type: {{membershipType}}</li>
                    </ul>
                    <p>To continue enjoying the benefits of World FZO membership, please renew before {{expiryDate}}.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="{{renewalUrl}}" style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Now</a>
                    </div>
                    <p>If you have any questions, please contact us at {{supportEmail}}.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nYour World FZO membership expires on {{expiryDate}}. Member ID: {{memberId}}.\n\nRenew now: {{renewalUrl}}",
          },
        ],
        requiredParams: [
          "organizationName",
          "memberId",
          "expiryDate",
          "daysRemaining",
          "membershipType",
          "renewalUrl",
          "supportEmail",
        ],
        isActive: true,
      },
      {
        templateCode: "MEMBERSHIP_EXPIRED",
        name: "Membership Expired",
        description: "Sent when membership has expired",
        translations: [
          {
            language: "en",
            subject: "World FZO Membership Expired",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545;">Membership Expired</h2>
                    <p>Dear {{organizationName}},</p>
                    <p>Your World FZO membership has expired as of {{expiredDate}}.</p>
                    <p><strong>Expired Membership Details:</strong></p>
                    <ul>
                      <li>Member ID: {{memberId}}</li>
                      <li>Membership Type: {{membershipType}}</li>
                      <li>Expiration Date: {{expiredDate}}</li>
                    </ul>
                    <p>Your access to member benefits and portal has been suspended. To restore your membership, please renew as soon as possible.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="{{renewalUrl}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Membership</a>
                    </div>
                    <p>For assistance, contact us at {{supportEmail}} or call {{supportPhone}}.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nYour World FZO membership expired on {{expiredDate}}. Member ID: {{memberId}}.\n\nRenew now: {{renewalUrl}}",
          },
        ],
        requiredParams: [
          "organizationName",
          "memberId",
          "membershipType",
          "expiredDate",
          "renewalUrl",
          "supportEmail",
          "supportPhone",
        ],
        isActive: true,
      },
      {
        templateCode: "EVENT_REGISTRATION_CONFIRMATION",
        name: "Event Registration Confirmation",
        description: "Sent when member registers for an event",
        translations: [
          {
            language: "en",
            subject: "Event Registration Confirmed - {{eventName}}",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">Event Registration Confirmed!</h2>
                    <p>Dear {{attendeeName}},</p>
                    <p>You have successfully registered for the following event:</p>
                    <div style="background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-left: 4px solid #0066cc;">
                      <h3 style="margin-top: 0; color: #0066cc;">{{eventName}}</h3>
                      <p><strong>Date:</strong> {{eventDate}}</p>
                      <p><strong>Time:</strong> {{eventTime}}</p>
                      <p><strong>Location:</strong> {{eventLocation}}</p>
                      <p><strong>Event Type:</strong> {{eventType}}</p>
                    </div>
                    <p><strong>Registration Details:</strong></p>
                    <ul>
                      <li>Registration ID: {{registrationId}}</li>
                      <li>Registered By: {{attendeeName}}</li>
                      <li>Registration Date: {{registrationDate}}</li>
                    </ul>
                    {{#if joinUrl}}
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="{{joinUrl}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Join Event</a>
                    </div>
                    {{/if}}
                    <p>We look forward to seeing you at the event!</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{attendeeName}},\n\nYou are registered for {{eventName}} on {{eventDate}} at {{eventTime}}.\n\nRegistration ID: {{registrationId}}\nLocation: {{eventLocation}}",
          },
        ],
        requiredParams: [
          "attendeeName",
          "eventName",
          "eventDate",
          "eventTime",
          "eventLocation",
          "eventType",
          "registrationId",
          "registrationDate",
        ],
        isActive: true,
      },
      {
        templateCode: "PASSWORD_RESET",
        name: "Password Reset",
        description: "Sent when user requests password reset",
        translations: [
          {
            language: "en",
            subject: "Reset Your World FZO Password",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0066cc;">Password Reset Request</h2>
                    <p>Dear {{userName}},</p>
                    <p>We received a request to reset your password for your World FZO account.</p>
                    <p>Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="{{resetUrl}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    <p><strong>Important Information:</strong></p>
                    <ul>
                      <li>This link will expire in {{expiryHours}} hours</li>
                      <li>If you didn't request this reset, please ignore this email</li>
                      <li>Your password will remain unchanged if you don't click the link</li>
                    </ul>
                    <p>For security reasons, never share this link with anyone.</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{userName}},\n\nReset your World FZO password by visiting:\n{{resetUrl}}\n\nThis link expires in {{expiryHours}} hours.\n\nIf you didn't request this, please ignore this email.",
          },
        ],
        requiredParams: ["userName", "resetUrl", "expiryHours"],
        isActive: true,
      },
      {
        templateCode: "WELCOME_EMAIL",
        name: "Welcome Email",
        description: "Sent to new members as a welcome message",
        translations: [
          {
            language: "en",
            subject: "Welcome to World FZO - Getting Started",
            htmlBody: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #0066cc; text-align: center;">Welcome to World FZO!</h1>
                    <p>Dear {{organizationName}},</p>
                    <p>Congratulations and welcome to the World FZO community! We're excited to have you as a member.</p>
                    <h3 style="color: #0066cc;">Your Membership Benefits:</h3>
                    <ul>
                      <li>Access to exclusive events and webinars</li>
                      <li>Networking opportunities with global FZO organizations</li>
                      <li>Access to industry resources and best practices</li>
                      <li>Member directory and collaboration platform</li>
                      <li>Priority support from our team</li>
                    </ul>
                    <h3 style="color: #0066cc;">Getting Started:</h3>
                    <ol>
                      <li>Complete your member profile: <a href="{{profileUrl}}">{{profileUrl}}</a></li>
                      <li>Explore upcoming events: <a href="{{eventsUrl}}">{{eventsUrl}}</a></li>
                      <li>Connect with other members: <a href="{{networkUrl}}">{{networkUrl}}</a></li>
                      <li>Access resources: <a href="{{resourcesUrl}}">{{resourcesUrl}}</a></li>
                    </ol>
                    <div style="background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
                      <p><strong>Your Member ID:</strong> {{memberId}}</p>
                      <p><strong>Membership Type:</strong> {{membershipType}}</p>
                      <p><strong>Valid Until:</strong> {{validUntil}}</p>
                    </div>
                    <p>If you have any questions or need assistance, don't hesitate to reach out to our support team at {{supportEmail}}.</p>
                    <p>We look forward to a successful partnership!</p>
                    <p>Best regards,<br/>World FZO Team</p>
                  </div>
                </body>
              </html>
            `,
            textBody:
              "Dear {{organizationName}},\n\nWelcome to World FZO!\n\nYour Member ID: {{memberId}}\nMembership Type: {{membershipType}}\nValid Until: {{validUntil}}\n\nGet started at: {{profileUrl}}\n\nBest regards,\nWorld FZO Team",
          },
        ],
        requiredParams: [
          "organizationName",
          "memberId",
          "membershipType",
          "validUntil",
          "profileUrl",
          "eventsUrl",
          "networkUrl",
          "resourcesUrl",
          "supportEmail",
        ],
        isActive: true,
      },
    ];

    for (const template of templates) {
      await this.emailTemplateModel.findOneAndUpdate(
        { templateCode: template.templateCode },
        { $set: template },
        { upsert: true },
      );
    }

    console.log(`✓ Seeded ${templates.length} email templates`);
  }

  async down(): Promise<void> {
    console.log("Removing email templates...");

    const templateCodes = [
      "MEMBER_REGISTRATION_CONFIRMATION",
      "MEMBER_APPROVAL_PENDING",
      "MEMBER_APPROVED",
      "MEMBER_REJECTED",
      "MEMBER_CREDENTIALS",
      "MEMBERSHIP_RENEWAL_REMINDER",
      "MEMBERSHIP_EXPIRED",
      "EVENT_REGISTRATION_CONFIRMATION",
      "PASSWORD_RESET",
      "WELCOME_EMAIL",
      "INTERNAL_USER_CREDENTIALS"
    ];

    await this.emailTemplateModel.deleteMany({
      templateCode: { $in: templateCodes },
    });

    console.log("✓ Email templates removed");
  }
}

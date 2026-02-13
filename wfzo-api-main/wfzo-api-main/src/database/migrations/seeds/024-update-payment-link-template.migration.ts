import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { EmailTemplate, SupportedLanguage } from "../../../shared/email/schemas/email-template.schema";

/**
 * Migration to update MEMBER_PAYMENT_LINK template with bank account details
 * Updates the email body to include accountHolder, accountNumber, and iban placeholders
 */
export class UpdatePaymentLinkTemplateMigration implements Migration {
  name = "024-update-payment-link-template";

  constructor(private readonly emailTemplateModel: Model<EmailTemplate>) {}

  async up(): Promise<void> {
    console.log("Updating MEMBER_PAYMENT_LINK template with current version including bank account details...");

    const result = await this.emailTemplateModel.replaceOne(
      { templateCode: "MEMBER_PAYMENT_LINK" },
      {
        templateCode: "MEMBER_PAYMENT_LINK",
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
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Completely replaced MEMBER_PAYMENT_LINK template with current version");
    } else {
      console.log("ℹ MEMBER_PAYMENT_LINK template was not found");
    }
  }

  async down(): Promise<void> {
    console.log("Reverting MEMBER_PAYMENT_LINK template to remove bank account details...");

    const result = await this.emailTemplateModel.updateOne(
      { templateCode: "MEMBER_PAYMENT_LINK" },
      {
        $set: {
          "translations.$[translation].htmlBody": `
              <h2>Congratulations! Your Application is Approved</h2>
              <p>Hi {{firstName}} {{lastName}},</p>
              <p>We are pleased to inform you that your membership application has been approved!</p>
              <p><strong>Application Number:</strong> {{applicationNumber}}</p>
              <p><strong>Member ID:</strong> {{memberId}}</p>
              <p><strong>Company:</strong> {{companyName}}</p>
              <p>To activate your membership, please complete the payment using the link below:</p>
              <p><a href="{{paymentLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a></p>
              <p>Once payment is received, your membership will be activated and you will receive your welcome package with login credentials.</p>
              <p>If you have any questions about the payment process, please contact us at membership@worldfzo.org</p>
              <p>We look forward to welcoming you as a member!</p>
              <p>Best regards,<br/>World FZO Team</p>
            `,
          "translations.$[translation].textBody": `Congratulations! Your Application is Approved

Hi {{firstName}} {{lastName}},

We are pleased to inform you that your membership application has been approved!

Application Number: {{applicationNumber}}
Member ID: {{memberId}}
Company: {{companyName}}

To activate your membership, please complete the payment using this link:
{{paymentLink}}

Once payment is received, your membership will be activated and you will receive your welcome package with login credentials.

If you have any questions about the payment process, please contact us at membership@worldfzo.org

We look forward to welcoming you as a member!

Best regards,
World FZO Team`,
          requiredParams: [
            "applicationNumber",
            "memberId",
            "companyName",
            "paymentLink",
            "firstName",
            "lastName",
          ]
        }
      },
      {
        arrayFilters: [{ "translation.language": SupportedLanguage.ENGLISH }]
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Reverted MEMBER_PAYMENT_LINK template to remove bank account details");
    } else {
      console.log("ℹ MEMBER_PAYMENT_LINK template was not found or already reverted");
    }
  }
}
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum EmailTemplateCode {
  MEMBER_REGISTRATION_CONFIRMATION = "MEMBER_REGISTRATION_CONFIRMATION",
  MEMBER_APPROVAL_PENDING = "MEMBER_APPROVAL_PENDING",
  MEMBER_APPROVED = "MEMBER_APPROVED",
  MEMBER_REJECTED = "MEMBER_REJECTED",
  MEMBER_CREDENTIALS = "MEMBER_CREDENTIALS",
  MEMBERSHIP_RENEWAL_REMINDER = "MEMBERSHIP_RENEWAL_REMINDER",
  MEMBERSHIP_EXPIRED = "MEMBERSHIP_EXPIRED",
  EVENT_REGISTRATION_CONFIRMATION = "EVENT_REGISTRATION_CONFIRMATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  WELCOME_EMAIL = "WELCOME_EMAIL",
  // New workflow templates
  MEMBER_PHASE1_CONFIRMATION = "MEMBER_PHASE1_CONFIRMATION",
  MEMBER_PHASE2_CONFIRMATION = "MEMBER_PHASE2_CONFIRMATION",
  MEMBER_PHASE2_ADMIN_NOTIFICATION = "MEMBER_PHASE2_ADMIN_NOTIFICATION",
  MEMBER_APPROVAL = "MEMBER_APPROVAL",
  MEMBER_REJECTION = "MEMBER_REJECTION",
  MEMBER_PAYMENT_LINK = "MEMBER_PAYMENT_LINK",
  MEMBER_WELCOME = "MEMBER_WELCOME",
  INTERNAL_USER_CREDENTIALS = "INTERNAL_USER_CREDENTIALS",
  // Event notification templates
  EVENT_SUBMITTED_FOR_APPROVAL = "EVENT_SUBMITTED_FOR_APPROVAL",
  EVENT_SUBMITTED_USER = "EVENT_SUBMITTED_USER",
  EVENT_APPROVED_USER = "EVENT_APPROVED_USER",
  EVENT_REJECTED_USER = "EVENT_REJECTED_USER",
  // Enquiry notification templates
  ENQUIRY_APPROVED = "ENQUIRY_APPROVED",
  ENQUIRY_REJECTED = "ENQUIRY_REJECTED",
  // Article notification templates
  ARTICLE_SUBMITTED_FOR_APPROVAL = "ARTICLE_SUBMITTED_FOR_APPROVAL",
  ARTICLE_SUBMITTED_USER = "ARTICLE_SUBMITTED_USER",
  ARTICLE_APPROVED_USER = "ARTICLE_APPROVED_USER",
  ARTICLE_REJECTED_USER = "ARTICLE_REJECTED_USER",
  // Chat notification templates
  NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE",
  NEW_CHAT_MESSAGE_MEMBER = "NEW_CHAT_MESSAGE_MEMBER",
  // Report notification templates
  MEMBER_REPORT_ADMIN = "MEMBER_REPORT_ADMIN",
  MEMBER_REPORT_CONFIRMATION = "MEMBER_REPORT_CONFIRMATION",
  // Connection notification templates
  CONNECTION_REQUEST_RECEIVED = "CONNECTION_REQUEST_RECEIVED",
  CONNECTION_REQUEST_ACCEPTED = "CONNECTION_REQUEST_ACCEPTED",
  ORGANIZATION_APPROVED_USER = "ORGANIZATION_APPROVED_USER",
  ORGANIZATION_REJECTED_USER = "ORGANIZATION_REJECTED_USER",
}

export enum SupportedLanguage {
  ENGLISH = "en",
  ARABIC = "ar",
}

@Schema({ timestamps: true })
export class EmailTemplate extends Document {
  @Prop({ type: String, required: true, enum: EmailTemplateCode })
  templateCode!: EmailTemplateCode;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  process?: string; // Workflow/process identifier (e.g., "memberOnboarding", "eventRegistration")

  @Prop({
    type: [
      {
        language: { type: String, enum: SupportedLanguage, required: true },
        subject: { type: String, required: true },
        htmlBody: { type: String, required: true },
        textBody: { type: String },
      },
    ],
    required: true,
  })
  translations!: {
    language: SupportedLanguage;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }[];

  @Prop({ type: [String], default: [] })
  requiredParams!: string[];

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

// Add indexes
// Unique indexes are created by migration if needed
// EmailTemplateSchema.index({ templateCode: 1 });
EmailTemplateSchema.index({ isActive: 1 });
EmailTemplateSchema.index({ deletedAt: 1 });

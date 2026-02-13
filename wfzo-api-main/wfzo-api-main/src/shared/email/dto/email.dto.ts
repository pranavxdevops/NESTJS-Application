import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EmailTemplateCode, SupportedLanguage } from "../schemas/email-template.schema";

export class SendEmailDto {
  @ApiProperty({
    description: "Recipient email address",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({
    description: "Email template code",
    enum: EmailTemplateCode,
    example: EmailTemplateCode.MEMBER_APPROVED,
  })
  @IsEnum(EmailTemplateCode)
  @IsNotEmpty()
  templateCode!: EmailTemplateCode;

  @ApiPropertyOptional({
    description: "Template parameters for substitution",
    example: {
      memberName: "John Doe",
      organizationName: "Acme Corp",
      approvalDate: "2025-11-07",
    },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Language for the email template",
    enum: SupportedLanguage,
    default: SupportedLanguage.ENGLISH,
  })
  @IsOptional()
  @IsEnum(SupportedLanguage)
  language?: SupportedLanguage;

  @ApiPropertyOptional({
    description: "CC email addresses",
    type: [String],
  })
  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({
    description: "BCC email addresses",
    type: [String],
  })
  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiPropertyOptional({
    description: "Reply-to email address",
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional({
    description: "Email attachments",
  })
  @IsOptional()
  attachments?: {
    name: string;
    contentType: string;
    contentInBase64: string;
  }[];
}

export class SendBulkEmailDto {
  @ApiProperty({
    description: "List of recipient email addresses",
    type: [String],
  })
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  to!: string[];

  @ApiProperty({
    description: "Email template code",
    enum: EmailTemplateCode,
  })
  @IsEnum(EmailTemplateCode)
  @IsNotEmpty()
  templateCode!: EmailTemplateCode;

  @ApiPropertyOptional({
    description: "Template parameters for substitution",
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Language for the email template",
    enum: SupportedLanguage,
    default: SupportedLanguage.ENGLISH,
  })
  @IsOptional()
  @IsEnum(SupportedLanguage)
  language?: SupportedLanguage;
}

export class CreateEmailTemplateDto {
  @ApiProperty({
    description: "Unique template code",
    enum: EmailTemplateCode,
  })
  @IsEnum(EmailTemplateCode)
  @IsNotEmpty()
  templateCode!: EmailTemplateCode;

  @ApiProperty({
    description: "Template name",
    example: "Member Approval Email",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: "Template description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Email template translations",
    type: "array",
    items: {
      type: "object",
      properties: {
        language: { type: "string", enum: Object.values(SupportedLanguage) },
        subject: { type: "string" },
        htmlBody: { type: "string" },
        textBody: { type: "string" },
      },
    },
  })
  @IsNotEmpty()
  translations!: {
    language: SupportedLanguage;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }[];

  @ApiPropertyOptional({
    description: "Required template parameters",
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  requiredParams?: string[];
}

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({
    description: "Template name",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Template description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Email template translations",
  })
  @IsOptional()
  translations?: {
    language: SupportedLanguage;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }[];

  @ApiPropertyOptional({
    description: "Required template parameters",
  })
  @IsOptional()
  @IsString({ each: true })
  requiredParams?: string[];

  @ApiPropertyOptional({
    description: "Template active status",
  })
  @IsOptional()
  isActive?: boolean;
}

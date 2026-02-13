import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "@shared/email/email.service";
import { EmailTemplateCode, SupportedLanguage } from "@shared/email/schemas/email-template.schema";
import {
  SendArticleEmailRequest,
  SendArticleEmailResponse,
  ArticleEmailType,
} from "./dto/article.dto";

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send article notification email
   */
  async sendArticleEmail(dto: SendArticleEmailRequest): Promise<SendArticleEmailResponse> {
    // Map the email type to template code
    const templateCodeMap: Record<ArticleEmailType, EmailTemplateCode> = {
      [ArticleEmailType.ARTICLE_SUBMITTED_FOR_APPROVAL]: EmailTemplateCode.ARTICLE_SUBMITTED_FOR_APPROVAL,
      [ArticleEmailType.ARTICLE_APPROVED_USER]: EmailTemplateCode.ARTICLE_APPROVED_USER,
      [ArticleEmailType.ARTICLE_REJECTED_USER]: EmailTemplateCode.ARTICLE_REJECTED_USER,
    };

    // Special handling for ARTICLE_SUBMITTED_FOR_APPROVAL - send to both admin and user
    if (dto.type === ArticleEmailType.ARTICLE_SUBMITTED_FOR_APPROVAL) {
      this.sendArticleSubmittedEmails(dto);
      return { message: "Emails sent successfully" };
    }

    const templateCode = templateCodeMap[dto.type];
    if (!templateCode) {
      throw new BadRequestException(`Invalid email type: ${dto.type}`);
    }

    const recipientEmail = dto.email;
    this.logger.log(`Sending article email of type ${dto.type} to ${recipientEmail}`);

    // Build email parameters
    const emailParams: Record<string, any> = {};

    if (dto.title) emailParams.title = dto.title;
    if (dto.description) emailParams.description = dto.description;
    // if (dto.shortDescription) emailParams.shortDescription = dto.shortDescription;
    if (dto.category) emailParams.category = dto.category;
    if (dto.organizerName) emailParams.organizerName = dto.organizerName;
    if (dto.eventType) emailParams.eventType = dto.eventType;
    if (dto.rejectionReason) emailParams.rejectionReason = dto.rejectionReason;
    if (dto.firstName) emailParams.firstName = dto.firstName;
    if (dto.lastName) emailParams.lastName = dto.lastName;

    try {
        this.emailService.sendTemplatedEmail({
        templateCode: templateCode as never,
        language: SupportedLanguage.ENGLISH,
        to: recipientEmail,
        params: emailParams,
      });

      this.logger.log(`Article email sent successfully to ${recipientEmail}`);
      return { message: "Email sent successfully" };
    } catch (error) {
      this.logger.error(`Failed to send article email to ${recipientEmail}:`, error);
      throw new BadRequestException(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Send both admin and user emails when article is submitted for approval
   */
  private async sendArticleSubmittedEmails(dto: SendArticleEmailRequest): Promise<void> {
    const adminEmail = this.configService.get<string>('WFZO_ADMIN_EMAIL');
    if (!adminEmail) {
      throw new BadRequestException('Admin email not configured');
    }

    // Build common email parameters
    const emailParams: Record<string, any> = {};
    if (dto.title) emailParams.title = dto.title;
    if (dto.description) emailParams.description = dto.description;
    // if (dto.shortDescription) emailParams.shortDescription = dto.shortDescription;
    if (dto.category) emailParams.category = dto.category;
    if (dto.organizerName) emailParams.organizerName = dto.organizerName;
    if (dto.eventType) emailParams.eventType = dto.eventType;

    // Send email to admin
    try {
        this.emailService.sendTemplatedEmail({
        templateCode: EmailTemplateCode.ARTICLE_SUBMITTED_FOR_APPROVAL,
        language: SupportedLanguage.ENGLISH,
        to: adminEmail,
        params: emailParams,
      });
      this.logger.log(`Admin notification email sent successfully to ${adminEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send admin email to ${adminEmail}:`, error);
      throw new BadRequestException(`Failed to send admin email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Send email to user
    const userParams = { ...emailParams };
    if (dto.firstName) userParams.firstName = dto.firstName;
    if (dto.lastName) userParams.lastName = dto.lastName;

    try {
        this.emailService.sendTemplatedEmail({
        templateCode: EmailTemplateCode.ARTICLE_SUBMITTED_USER,
        language: SupportedLanguage.ENGLISH,
        to: dto.email,
        params: userParams,
      });
      this.logger.log(`User notification email sent successfully to ${dto.email}`);
    } catch (error) {
      this.logger.error(`Failed to send user email to ${dto.email}:`, error);
      throw new BadRequestException(`Failed to send user email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
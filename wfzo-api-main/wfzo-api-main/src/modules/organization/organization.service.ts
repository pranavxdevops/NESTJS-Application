import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "@shared/email/email.service";
import { SupportedLanguage } from "@shared/email/schemas/email-template.schema";
import {
  SendOrganizationEmailRequest,
  OrganizationEmailType,
  SendOrganizationEmailResponse,
} from "./dto/organization.dto";

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendOrganizationEmail(
    dto: SendOrganizationEmailRequest,
  ): Promise<SendOrganizationEmailResponse> {
    const templateCodeMap: Record<OrganizationEmailType, string> = {
      [OrganizationEmailType.ORGANIZATION_APPROVED_USER]: "ORGANIZATION_APPROVED_USER",
      [OrganizationEmailType.ORGANIZATION_REJECTED_USER]: "ORGANIZATION_REJECTED_USER",
    };

    const templateCode = templateCodeMap[dto.type];
    if (!templateCode) {
      throw new BadRequestException(`Invalid email type: ${dto.type}`);
    }

    const recipientEmail = dto.email;
    this.logger.log(`Sending organization email of type ${dto.type} to ${recipientEmail}`);

    const emailParams: Record<string, any> = {};

    if (dto.title) emailParams.title = dto.title;
    if (dto.description) emailParams.description = dto.description;
    if (dto.organizerName) emailParams.organizerName = dto.organizerName;
    if (dto.rejectionReason) emailParams.rejectionReason = dto.rejectionReason;

    try {
      await this.emailService.sendTemplatedEmail({
        templateCode: templateCode as never,
        language: SupportedLanguage.ENGLISH,
        to: recipientEmail,
        params: emailParams,
      });

      this.logger.log(`Organization email sent successfully to ${recipientEmail}`);
      return { message: "Email sent successfully" };
    } catch (error) {
      this.logger.error(`Failed to send organization email to ${recipientEmail}:`, error);
      throw new BadRequestException(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

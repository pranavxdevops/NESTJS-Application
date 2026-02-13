import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { EmailClient, EmailMessage } from "@azure/communication-email";
import { ConfigService } from "@nestjs/config";
import { EmailTemplateRepository } from "./repository/email-template.repository";
import { HandlebarsRenderer, ITemplateRenderer } from "./template-renderer";
import {
  SendEmailDto,
  SendBulkEmailDto,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
} from "./dto/email.dto";
import {
  EmailTemplateCode,
  SupportedLanguage,
  EmailTemplate,
} from "./schemas/email-template.schema";

/**
 * Email service using Azure Communication Services
 * Implements template pattern for email rendering
 * Supports multiple languages and template management
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailClient: EmailClient;
  private readonly senderAddress: string;
  private readonly templateRenderer: ITemplateRenderer;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateRepository: EmailTemplateRepository,
  ) {
    const connectionString = this.configService.get<string>(
      "AZURE_COMMUNICATION_CONNECTION_STRING",
    );
    this.senderAddress =
      this.configService.get<string>("AZURE_COMMUNICATION_SENDER_ADDRESS") ??
      "donotreply@theonezone.org";

    if (!connectionString) {
      throw new Error("AZURE_COMMUNICATION_CONNECTION_STRING is not configured");
    }

    this.emailClient = new EmailClient(connectionString);
    this.templateRenderer = new HandlebarsRenderer();
    this.logger.log("Email service initialized with Azure Communication Services");
  }

  /**
   * Send a templated email to a single recipient
   */
  async sendTemplatedEmail(dto: SendEmailDto): Promise<void> {
    const {
      to,
      templateCode,
      params = {},
      language = SupportedLanguage.ENGLISH,
      cc,
      bcc,
      replyTo,
      attachments,
    } = dto;

    this.logger.log(`Sending email using template ${templateCode} to ${to}`);

    // Fetch template from database
    const template = await this.emailTemplateRepository.findByCode(templateCode);
    if (!template) {
      throw new NotFoundException(`Email template with code ${templateCode} not found`);
    }

    // Get translation for specified language
    const translation = template.translations.find((t) => t.language === language);
    if (!translation) {
      throw new NotFoundException(`Template translation not found for language ${language}`);
    }

    // Validate required parameters
    this.validateRequiredParams(template.requiredParams, params);

    // Render template with parameters
    const subject = this.templateRenderer.render(translation.subject, params);
    const htmlBody = this.templateRenderer.render(translation.htmlBody, params);
    const textBody = translation.textBody
      ? this.templateRenderer.render(translation.textBody, params)
      : undefined;

    // Send email via Azure Communication Services
    await this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
      cc,
      bcc,
      replyTo,
      attachments,
    });

    this.logger.log(`Email sent successfully to ${to}`);
  }

  /**
   * Send bulk emails with the same template
   */
  async sendBulkTemplatedEmail(dto: SendBulkEmailDto): Promise<void> {
    const { to, templateCode, params = {}, language = SupportedLanguage.ENGLISH } = dto;

    this.logger.log(`Sending bulk email using template ${templateCode} to ${to.length} recipients`);

    // Send emails in parallel with rate limiting (max 10 concurrent)
    const chunkSize = 10;
    for (let i = 0; i < to.length; i += chunkSize) {
      const chunk = to.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((email) =>
          this.sendTemplatedEmail({
            to: email,
            templateCode,
            params,
            language,
          }),
        ),
      );
    }

    this.logger.log(`Bulk email sent successfully to ${to.length} recipients`);
  }

  /**
   * Send a custom email (without template)
   */
  async sendEmail(emailData: {
    to: string | string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: {
      name: string;
      contentType: string;
      contentInBase64: string;
    }[];
  }): Promise<void> {
    const { to, subject, htmlBody, textBody, cc, bcc, replyTo, attachments } = emailData;

    const recipients = Array.isArray(to) ? to : [to];

    const message: EmailMessage = {
      senderAddress: this.senderAddress,
      content: {
        subject,
        html: htmlBody,
        plainText: textBody,
      },
      recipients: {
        to: recipients.map((email) => ({ address: email })),
        cc: cc?.map((email) => ({ address: email })),
        bcc: bcc?.map((email) => ({ address: email })),
      },
      replyTo: replyTo ? [{ address: replyTo }] : undefined,
      attachments: attachments?.map((att) => ({
        name: att.name,
        contentType: att.contentType,
        contentInBase64: att.contentInBase64,
      })),
    };

    try {
      const poller = await this.emailClient.beginSend(message);
      const result = await poller.pollUntilDone();
      this.logger.debug(`Email sent with ID: ${result.id}, Status: ${result.status}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      throw new BadRequestException(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a new email template
   */
  async createTemplate(dto: CreateEmailTemplateDto) {
    this.logger.log(`Creating email template: ${dto.templateCode}`);

    // Auto-extract required params from HTML body if not provided
    if (!dto.requiredParams && dto.translations.length > 0) {
      const renderer = new HandlebarsRenderer();
      const params = new Set<string>();

      dto.translations.forEach((translation) => {
        const subjectParams = renderer.extractParams(translation.subject);
        const bodyParams = renderer.extractParams(translation.htmlBody);
        [...subjectParams, ...bodyParams].forEach((p) => params.add(p));
      });

      dto.requiredParams = Array.from(params);
    }

    return this.emailTemplateRepository.create(dto);
  }

  /**
   * Update an email template
   */
  async updateTemplate(
    code: EmailTemplateCode,
    updates: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findByCode(code);
    if (!template) {
      throw new Error(`Email template with code ${code} not found`);
    }

    const updated = await this.emailTemplateRepository.updateById(
      String(template._id),
      updates as Partial<EmailTemplate>,
    );

    if (!updated) {
      throw new Error(`Failed to update email template ${code}`);
    }

    return updated;
  }

  /**
   * Get template by code
   */
  async getTemplate(templateCode: EmailTemplateCode) {
    const template = await this.emailTemplateRepository.findByCode(templateCode);
    if (!template) {
      throw new NotFoundException(`Email template with code ${templateCode} not found`);
    }
    return template;
  }

  /**
   * Get all active templates
   */
  async getAllTemplates() {
    return this.emailTemplateRepository.findAllActive();
  }

  /**
   * Soft delete a template
   */
  async deleteTemplate(templateCode: EmailTemplateCode) {
    const template = await this.emailTemplateRepository.findByCode(templateCode);
    if (!template) {
      throw new NotFoundException(`Email template with code ${templateCode} not found`);
    }

    await this.emailTemplateRepository.updateById(String(template._id), {
      deletedAt: new Date(),
    } as Partial<EmailTemplate>);

    this.logger.log(`Email template ${templateCode} soft deleted`);
  }

  /**
   * Validate that all required parameters are provided
   */
  private validateRequiredParams(
    requiredParams: string[],
    providedParams: Record<string, any>,
  ): void {
    const missingParams = requiredParams.filter((param) => !(param in providedParams));

    if (missingParams.length > 0) {
      throw new BadRequestException(
        `Missing required template parameters: ${missingParams.join(", ")}`,
      );
    }
  }

  /**
   * Preview a template with given parameters (for testing)
   */
  async previewTemplate(
    templateCode: EmailTemplateCode,
    params: Record<string, any>,
    language: SupportedLanguage = SupportedLanguage.ENGLISH,
  ) {
    const template = await this.emailTemplateRepository.findByCode(templateCode);
    if (!template) {
      throw new NotFoundException(`Email template with code ${templateCode} not found`);
    }

    const translation = template.translations.find((t) => t.language === language);
    if (!translation) {
      throw new NotFoundException(`Template translation not found for language ${language}`);
    }

    return {
      subject: this.templateRenderer.render(translation.subject, params),
      htmlBody: this.templateRenderer.render(translation.htmlBody, params),
      textBody: translation.textBody
        ? this.templateRenderer.render(translation.textBody, params)
        : undefined,
    };
  }
}

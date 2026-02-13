import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "@shared/email/email.service";
import { EmailTemplateRepository } from "@shared/email/repository/email-template.repository";
import { EmailTemplate } from "@shared/email/schemas/email-template.schema";
import { Member } from "../../schemas/member.schema";

/**
 * Email template configuration loaded from database
 */
interface EmailTemplateConfig {
  code: string;
  requiresPrimaryUser: boolean;
}

/**
 * Centralized notification service for member workflow
 * Handles all email communications during the onboarding journey
 *
 * Uses Template Method Pattern to reduce code duplication
 * Follows Single Responsibility Principle - only handles notifications
 *
 * Templates are loaded from database on module initialization
 */
@Injectable()
export class WorkflowNotificationService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowNotificationService.name);
  private readonly adminEmail: string;
  private readonly frontendBaseUrl: string;
  private readonly bankAccountNumber: string;
  private readonly bankAccountHolder: string;
  private readonly bankIban: string;

  // Email templates loaded from database
  private emailTemplates: Map<string, EmailTemplateConfig> = new Map();

  constructor(
    private readonly emailService: EmailService,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail = this.configService.get<string>("WFZO_ADMIN_EMAIL") || "admin@worldfzo.org";
    this.frontendBaseUrl =
      this.configService.get<string>("FRONTEND_BASE_URL") || "https://www.theonezone.org";
    this.bankAccountNumber = this.configService.get<string>("BANK_ACCOUNT_NUMBER") || "xxxxxxxxxxxxxxxx";
    this.bankIban = this.configService.get<string>("BANK_IBAN") || "xxxxxxxxxxxxxxxx";
    this.bankAccountHolder = this.configService.get<string>("BANK_ACCOUNT_NAME") || "World Free Zone Organization";
  }

  /**
   * Load email templates from database on module initialization
   */
  async onModuleInit() {
    await this.loadEmailTemplates();
  }

  /**
   * Load email templates for member onboarding process from database
   */
  private async loadEmailTemplates() {
    try {
      const templates = await this.emailTemplateRepository.findByProcess("memberOnboarding");

      if (templates.length === 0) {
        this.logger.warn("No email templates found for memberOnboarding process");
        return;
      }

      // Map templates by their code
      templates.forEach((template: EmailTemplate) => {
        this.emailTemplates.set(template.templateCode, {
          code: template.templateCode,
          requiresPrimaryUser: this.shouldRequirePrimaryUser(template.templateCode),
        });
      });

      this.logger.log(`Loaded ${templates.length} email templates for memberOnboarding process`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load email templates: ${errorMessage}`);
      // Don't throw - allow service to start but log warning
      this.logger.warn("Email notifications will not work until templates are properly configured");
    }
  }

  /**
   * Determine if a template requires primary user based on template code
   */
  private shouldRequirePrimaryUser(templateCode: string): boolean {
    // Admin notifications don't require primary user
    return !templateCode.includes("ADMIN");
  }

  /**
   * Send Phase 1 confirmation email
   */
  async sendPhase1Confirmation(member: Member): Promise<void> {
    const phase2Url = this.buildPhase2Url(member.applicationNumber);
    const template = this.emailTemplates.get("MEMBER_PHASE1_CONFIRMATION");

    if (!template) {
      this.logger.error("MEMBER_PHASE1_CONFIRMATION template not loaded");
      return;
    }

    await this.sendEmail({
      template,
      member,
      additionalParams: { phase2Url },
      context: "Phase 1 confirmation",
    });
  }

  /**
   * Send Phase 2 confirmation emails (to member and admin)
   */
  async sendPhase2Confirmation(member: Member): Promise<void> {
    const memberTemplate = this.emailTemplates.get("MEMBER_PHASE2_CONFIRMATION");
    const adminTemplate = this.emailTemplates.get("MEMBER_PHASE2_ADMIN_NOTIFICATION");

    if (!memberTemplate || !adminTemplate) {
      this.logger.error("Phase 2 templates not loaded");
      return;
    }

    // Send to member
    await this.sendEmail({
      template: memberTemplate,
      member,
      context: "Phase 2 confirmation",
    });

    // Send to admin
    await this.sendEmail({
      template: adminTemplate,
      member,
      recipientEmail: this.adminEmail,
      additionalParams: { category: member.category },
      context: "Phase 2 admin notification",
    });
  }

  /**
   * Send approval notification
   */
  async sendApprovalNotification(member: Member, approvalStage: string): Promise<void> {
    // Skip sending email for committee, board, and CEO approvals
    // CEO approval triggers payment link creation and notification
    if (approvalStage === "committee" || approvalStage === "board" || approvalStage === "ceo") {
      this.logger.log(`Skipping approval notification for ${approvalStage} stage`);
      return;
    }

    const template = this.emailTemplates.get("MEMBER_APPROVAL");

    if (!template) {
      this.logger.error("MEMBER_APPROVAL template not loaded");
      return;
    }

    await this.sendEmail({
      template,
      member,
      additionalParams: { approvalStage },
      context: `Approval notification (${approvalStage})`,
    });
  }

  /**
   * Send rejection notification
   */
  async sendRejectionNotification(member: Member, comments: string): Promise<void> {
    const template = this.emailTemplates.get("MEMBER_REJECTION");

    if (!template) {
      this.logger.error("MEMBER_REJECTION template not loaded");
      return;
    }

    await this.sendEmail({
      template,
      member,
      additionalParams: { rejectionReason: comments },
      context: "Rejection notification",
    });
  }

  /**
   * Send payment link email
   */
  async sendPaymentLinkNotification(member: Member, paymentLink: string): Promise<void> {
    const template = this.emailTemplates.get("MEMBER_PAYMENT_LINK");

    if (!template) {
      this.logger.error("MEMBER_PAYMENT_LINK template not loaded");
      return;
    }

    await this.sendEmail({
      template,
      member,
      additionalParams: {
        paymentLink,
        accountNumber: this.bankAccountNumber,
        iban: this.bankIban,
        accountHolder: this.bankAccountHolder,
      },
      context: "Payment link notification",
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeNotification(member: Member, temporaryPassword: string): Promise<void> {
    const primaryUser = this.getPrimaryUser(member);
    if (!primaryUser) return;

    const template = this.emailTemplates.get("MEMBER_WELCOME");

    if (!template) {
      this.logger.error("MEMBER_WELCOME template not loaded");
      return;
    }

    await this.sendEmail({
      template,
      member,
      additionalParams: {
        userEmail: primaryUser.email,
        firstName: primaryUser.firstName || "",
        lastName: primaryUser.lastName || "",
        temporaryPassword,
        frontendBaseUrl: this.frontendBaseUrl,
      },
      context: "Welcome notification",
    });
  }

  /**
   * Template method for sending emails
   * Implements common logic: validation, parameter building, error handling
   */
  private async sendEmail(options: {
    template: EmailTemplateConfig;
    member: Member;
    recipientEmail?: string;
    additionalParams?: Record<string, unknown>;
    context: string;
  }): Promise<void> {
    const { template, member, recipientEmail, additionalParams = {}, context } = options;

    // Determine recipient
    let recipient: string;
    if (recipientEmail) {
      recipient = recipientEmail;
    } else if (template.requiresPrimaryUser) {
      const primaryUser = this.getPrimaryUser(member);
      if (!primaryUser) {
        this.logger.warn(`No primary user found for member ${member.memberId} - ${context}`);
        return;
      }
      recipient = primaryUser.email;
    } else {
      this.logger.error(`No recipient specified for ${context}`);
      return;
    }

    // Build base parameters
    const baseParams = this.buildBaseParams(member);

    // Merge with additional parameters
    const params = { ...baseParams, ...additionalParams };

    // Send email
    try {
      await this.emailService.sendTemplatedEmail({
        templateCode: template.code as never,
        language: "en" as never,
        to: recipient,
        params,
      } as never);

      this.logger.log(`${context} sent to ${recipient}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to send ${context}: ${errorMessage}`);
    }
  }

  /**
   * Build base email parameters from member data
   */
  private buildBaseParams(member: Member): Record<string, string> {
    const primaryUser = this.getPrimaryUser(member);
    return {
      applicationNumber: member.applicationNumber || "",
      memberId: member.memberId || "",
      companyName: member.organisationInfo?.companyName || "your organization",
      firstName: primaryUser?.firstName || "Applicant",
      lastName: primaryUser?.lastName || "",
    };
  }

  /**
   * Get primary user from member snapshots
   */
  private getPrimaryUser(member: Member) {
    return member.userSnapshots?.find((u) => u.userType === "Primary");
  }

  /**
   * Build Phase 2 URL
   */
  private buildPhase2Url(applicationNumber: string): string {
    return `${this.frontendBaseUrl}/membership/application/${applicationNumber}`;
  }
}

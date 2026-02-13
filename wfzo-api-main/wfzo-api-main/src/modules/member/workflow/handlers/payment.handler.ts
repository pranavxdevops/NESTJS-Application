import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { MemberRepository } from "../../repository/member.repository";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import {
  IPaymentHandler,
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import { UpdatePaymentLinkDto, UpdatePaymentStatusDto } from "../../dto/approval-workflow.dto";
import { Member } from "../../schemas/member.schema";
import { EntraService } from "../../../auth/entra.service";

/**
 * Handles Payment Flow: Payment Link → Payment Completion → Activation
 *
 * Responsibilities:
 * - Add payment link and send notification
 * - Mark payment as completed
 * - Activate membership (set validUntil, status=active)
 * - Send welcome email on activation
 */
@Injectable()
export class PaymentHandler implements IPaymentHandler {
  private readonly logger = new Logger(PaymentHandler.name);
  private readonly authProvider: string;

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly notificationService: WorkflowNotificationService,
    private readonly entraService: EntraService,
    private readonly configService: NestConfigService,
  ) {
    this.authProvider = this.configService.get<string>("AUTH_PROVIDER", "entra");
    this.logger.log(`PaymentHandler initialized with auth provider: ${this.authProvider}`);
  }

  getPhase(): string {
    return MemberWorkflowPhases.PAYMENT_LINK;
  }

  canHandle(context: MemberWorkflowContext): boolean {
    return (
      context.phase === MemberWorkflowPhases.PAYMENT_LINK ||
      context.phase === MemberWorkflowPhases.PAYMENT_COMPLETION ||
      context.phase === MemberWorkflowPhases.PAYMENT_RESET
    );
  }

  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const { phase, entityId, data } = context;

    if (!entityId) {
      return {
        success: false,
        entity: {} as Member,
        phase,
        error: "Member ID is required for payment operations",
      };
    }

    if (phase === MemberWorkflowPhases.PAYMENT_LINK) {
      return this.executeAddPaymentLink(entityId, data as UpdatePaymentLinkDto);
    } else if (phase === MemberWorkflowPhases.PAYMENT_COMPLETION) {
      return this.executeCompletePayment(entityId, data as UpdatePaymentStatusDto);
    } else if (phase === MemberWorkflowPhases.PAYMENT_RESET) {
      return this.executeResetPayment(entityId, data as UpdatePaymentStatusDto);
    }

    return {
      success: false,
      entity: {} as Member,
      phase,
      error: "Invalid payment phase",
    };
  }

  async executeAddPaymentLink(
    memberId: string,
    dto: UpdatePaymentLinkDto,
  ): Promise<MemberWorkflowResult> {
    this.logger.log(`Adding payment link for ${memberId}`);

    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 2: Validate member status
      if (existingMember.status !== "approvedPendingPayment") {
        throw new BadRequestException(
          `Cannot add payment link. Current status: ${existingMember.status}. Expected: pendingPayment`,
        );
      }

      // Step 3: Update payment link
      await this.memberRepository.updateOne(
        { memberId },
        { $set: { paymentLink: dto.paymentLink, paymentStatus: dto.paymentStatus || existingMember.paymentStatus } },
      );

      const updatedMember = await this.memberRepository.findOne({ memberId });
      if (!updatedMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found after update`);
      }

      // Step 4: Send payment link notification
      this.notificationService.sendPaymentLinkNotification(updatedMember, dto.paymentLink);

      this.logger.log(`Payment link added for ${memberId}`);

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PAYMENT_LINK,
        nextPhase: MemberWorkflowPhases.PAYMENT_COMPLETION,
        message: "Payment link added and notification sent",
      };
    } catch (error) {
      this.logger.error(
        `Payment link addition failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PAYMENT_LINK,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async completePayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    return this.executeCompletePayment(memberId, dto);
  }

  async executeCompletePayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    this.logger.log(`Completing payment for ${memberId}`);

    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 2: Validate payment status transition
      if (dto.paymentStatus !== "paid") {
        throw new BadRequestException("Payment status must be 'paid' to complete payment");
      }

      // Step 3: Calculate membership validity (1 year from now)
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      // Step 4: Update member: status=active, paymentStatus=paid, set validUntil, set allowedUserCount, set approvalLetterDate
      const allowedUserCount = this.configService.get<number>("ALLOWED_USER_COUNT", 5);
      const approvalDate = new Date(); // Set approval letter date to current date
      await this.memberRepository.updateOne(
        { memberId },
        {
          $set: {
            paymentStatus: dto.paymentStatus,
            status: "active",
            validUntil,
            allowedUserCount,
            approvalDate,
          },
        },
      );

      const updatedMember = await this.memberRepository.findOne({ memberId });
      if (!updatedMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found after update`);
      }
      const primaryUser = updatedMember.userSnapshots?.find((u) => u.userType === "Primary");
      if (!primaryUser) {
        return {
          success: false,
          entity: {} as Member,
          phase: MemberWorkflowPhases.PAYMENT_COMPLETION,
          error: "Primary user not found",
        };
      }

      if (!primaryUser.firstName || !primaryUser.lastName) {
        return {
          success: false,
          entity: {} as Member,
          phase: MemberWorkflowPhases.PAYMENT_COMPLETION,
          error: "Primary user missing required fields (firstName or lastName)",
        };
      }

      // Create user in the configured auth provider (Entra)
      let temporaryPassword: string;

      this.logger.log(`Creating user in Entra ID for ${primaryUser.email}`);
      const entraResult = await this.entraService.createUser({
        email: primaryUser.email,
        firstName: primaryUser.firstName,
        lastName: primaryUser.lastName,
      });
      temporaryPassword = entraResult.temporaryPassword;

      // Step 5: Send welcome email
      this.notificationService.sendWelcomeNotification(
        updatedMember,
        temporaryPassword,
      );

      this.logger.log(
        `Payment completed for ${memberId}. Membership activated until ${validUntil.toISOString()}`,
      );

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PAYMENT_COMPLETION,
        message: `Membership activated. Valid until ${validUntil.toDateString()}`,
      };
    } catch (error) {
      this.logger.error(
        `Payment completion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PAYMENT_COMPLETION,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async resetPayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    return this.executeResetPayment(memberId, dto);
  }

  async executeResetPayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    this.logger.log(`Resetting payment for ${memberId}`);
    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 2: Update member paymentStatus and paymentLink
      await this.memberRepository.updateOne(
        { memberId },
        {
          $set: {
            paymentStatus: dto.paymentStatus,
            paymentLink: null,
          },
        },
      );

      const updatedMember = await this.memberRepository.findOne({ memberId });
      if (!updatedMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found after update`);
      }

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PAYMENT_RESET,
        message: `Member payment status reset to ${dto.paymentStatus}`,
      };
    } catch (error) {
      this.logger.error(
        `Payment completion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PAYMENT_RESET,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

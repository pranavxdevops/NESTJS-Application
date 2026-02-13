import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MemberRepository } from "../../repository/member.repository";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import {
  IApprovalHandler,
  MemberWorkflowContext,
  MemberWorkflowResult,
  MemberWorkflowPhases,
} from "../interfaces/workflow.interface";
import { UpdateStatusDto } from "../../dto/approval-workflow.dto";
import { Member, ApprovalHistoryEntry } from "../../schemas/member.schema";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";
import { WorkflowValidatorFactory } from "../validators/workflow-validator.factory";

/**
 * Handles Approval Flow: Committee → Board → CEO (Database-Driven with Validation Chain)
 *
 * Responsibilities:
 * - Validate approval workflow using Chain of Responsibility pattern
 * - Track approval in approvalHistory[]
 * - Transition status to next approval stage
 * - Send approval notification emails
 *
 * NOTE: Validation logic has been extracted to separate validator classes
 * using Chain of Responsibility pattern for better separation of concerns.
 */
@Injectable()
export class ApprovalHandler implements IApprovalHandler {
  private readonly logger = new Logger(ApprovalHandler.name);
  private readonly workflowType = WorkflowType.MEMBER_ONBOARDING;

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly notificationService: WorkflowNotificationService,
    private readonly workflowTransitionRepository: WorkflowTransitionRepository,
    private readonly validatorFactory: WorkflowValidatorFactory,
    private readonly configService: ConfigService,
  ) {}

  getPhase(): string {
    // This handler can handle multiple approval phases (database-driven)
    return MemberWorkflowPhases.COMMITTEE_APPROVAL;
  }

  canHandle(context: MemberWorkflowContext): boolean {
    return (
      context.phase === MemberWorkflowPhases.COMMITTEE_APPROVAL ||
      context.phase === MemberWorkflowPhases.CEO_APPROVAL
    );
  }

  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const { entityId, data } = context;
    if (!entityId) {
      return {
        success: false,
        entity: {} as Member,
        phase: context.phase,
        error: "Member ID is required for approval",
      };
    }

    const dto = data as UpdateStatusDto;
    return this.execute(entityId, dto);
  }

  async execute(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Executing approval for ${memberId}`);

    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 2: Run validation chain
      const validationResult = await this.runValidationChain(existingMember, dto);

      if (!validationResult.transition) {
        throw new BadRequestException("Validation failed: No transition information available");
      }

      const transition = validationResult.transition;

      // Step 3: Create approval history entry
      const approvalEntry: ApprovalHistoryEntry = {
        approvalStage: transition.approvalStage,
        order: transition.order,
        approvedBy: dto.actionBy,
        approverEmail: dto.actionByEmail,
        approvedAt: new Date(),
        comments: dto.comments,
      };

      // Step 4: Determine next status based on approval stage
      let nextStatus = transition.nextStatus;
      if (transition.approvalStage === "committee") {
        // For committee approval, check if required actions are met (approvals + rejections)
        const requiredActions = this.configService.get<number>("REQUIRED_COMMITTEE_ACTIONS", 2);
        const currentCommitteeApprovals = (existingMember.approvalHistory || []).filter(
          (a) => a.approvalStage === "committee",
        ).length;
        const currentCommitteeRejections = (existingMember.rejectionHistory || []).filter(
          (r) => r.rejectionStage === "committee",
        ).length;
        const totalCommitteeActions = currentCommitteeApprovals + currentCommitteeRejections;

        if (totalCommitteeActions + 1 < requiredActions) {
          // Not enough actions yet, stay in current status
          nextStatus = existingMember.status;
          this.logger.log(
            `Committee action recorded for ${memberId}: ${totalCommitteeActions + 1}/${requiredActions} actions (approvals: ${currentCommitteeApprovals + 1}, rejections: ${currentCommitteeRejections})`,
          );
        } else {
          // Required actions met, transition to next status
          this.logger.log(
            `Committee action threshold met for ${memberId}: ${totalCommitteeActions + 1}/${requiredActions} actions, transitioning to ${nextStatus}`,
          );
        }
      }

      // Step 5: Update member with new status and approval history
      const updatedMember = await this.updateMemberApproval(
        memberId,
        nextStatus,
        approvalEntry,
      );

      // Step 6: Send approval notification only if status changed
      if (nextStatus !== existingMember.status) {
        this.notificationService.sendApprovalNotification(
          updatedMember,
          transition.approvalStage,
        );
      }

      this.logger.log(
        `Approval completed for ${memberId}: ${existingMember.status} → ${nextStatus} (Order: ${transition.order})`,
      );

      return {
        success: true,
        entity: updatedMember,
        phase: transition.phase,
        nextPhase: nextStatus !== existingMember.status ? await this.getNextPhase(nextStatus) : undefined,
        message: `Approved by ${transition.approvalStage}. Status: ${nextStatus}`,
      };
    } catch (error) {
      this.logger.error(
        `Approval execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.COMMITTEE_APPROVAL, // Default phase
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Run validation chain using Chain of Responsibility pattern
   * Throws BadRequestException if any validation fails
   */
  private async runValidationChain(member: Member, dto: UpdateStatusDto): Promise<{
    transition: {
      nextStatus: string;
      phase: string;
      approvalStage: string;
      order: number;
    };
  }> {
    const validator = this.validatorFactory.createApprovalValidationChain();

    const validationContext: {
      entity: Member;
      currentStatus: string;
      currentUserEmail?: string;
      transition?: {
        nextStatus: string;
        phase: string;
        approvalStage: string;
        order: number;
      };
    } = {
      entity: member,
      currentStatus: member.status,
      currentUserEmail: dto.actionByEmail,
    };

    const result = await validator.validate(validationContext);

    if (!result.isValid) {
      throw new BadRequestException(result.error || "Validation failed");
    }

    if (!validationContext.transition) {
      throw new BadRequestException("Validation succeeded but transition information is missing");
    }

    return { transition: validationContext.transition };
  }

  /**
   * Update member with approval
   */
  private async updateMemberApproval(
    memberId: string,
    nextStatus: string,
    approvalEntry: ApprovalHistoryEntry,
  ): Promise<Member> {
    await this.memberRepository.updateOne(
      { memberId },
      {
        $set: { status: nextStatus },
        $push: { approvalHistory: approvalEntry },
      },
    );

    const updatedMember = await this.memberRepository.findOne({ memberId });
    if (!updatedMember) {
      throw new NotFoundException(`Member with ID ${memberId} not found after approval`);
    }

    return updatedMember;
  }

  /**
   * Get next workflow phase based on status (Database-Driven)
   */
  private async getNextPhase(status: string): Promise<string | undefined> {
    const transition = await this.workflowTransitionRepository.getTransition(
      this.workflowType,
      status,
    );
    return transition?.phase;
  }
}

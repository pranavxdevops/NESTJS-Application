import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MemberRepository } from "../../repository/member.repository";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import {
  IRejectionHandler,
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import { UpdateStatusDto } from "../../dto/approval-workflow.dto";
import { Member, RejectionHistoryEntry } from "../../schemas/member.schema";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";

/**
 * Handles Rejection Flow with strict order enforcement
 *
 * Responsibilities:
 * - Validate rejection data (reason is required)
 * - Enforce rejection order: Can only reject at current or next approval stage
 * - Track rejection in rejectionHistory[] with order field
 * - Set status to 'rejected'
 * - Send rejection notification email
 *
 * Rejection Rules:
 * - Committee can reject members at pendingCommitteeApproval (order 1)
 * - Board can reject members at pendingBoardApproval (order 2) - must have committee approval first
 * - CEO can reject members at pendingCEOApproval (order 3) - must have board approval first
 * - Cannot skip stages: e.g., CEO cannot reject if board hasn't approved yet
 */
@Injectable()
export class RejectionHandler implements IRejectionHandler {
  private readonly logger = new Logger(RejectionHandler.name);

  // Map member status to rejection stage and order
  private readonly statusToStageMap: Record<string, { stage: string; order: number }> = {
    pendingCommitteeApproval: { stage: "committee", order: 1 },
    pendingCEOApproval: { stage: "ceo", order: 2 },
    pendingFormSubmission: { stage: "admin", order: 0 },
    approvedPendingPayment: { stage: "admin", order: 0 },
  };

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly notificationService: WorkflowNotificationService,
    private readonly configService: ConfigService,
    private readonly workflowTransitionRepository: WorkflowTransitionRepository,
  ) {}

  getPhase(): string {
    return MemberWorkflowPhases.REJECTION;
  }

  canHandle(context: MemberWorkflowContext): boolean {
    return context.phase === MemberWorkflowPhases.REJECTION;
  }

  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const { entityId, data } = context;
    if (!entityId) {
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.REJECTION,
        error: "Member ID is required for rejection",
      };
    }

    const dto = data as UpdateStatusDto;
    return this.execute(entityId, dto);
  }

  async execute(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Executing rejection for ${memberId}`);

    try {
      // Step 1: Validate comments are provided for rejection
      if (!dto.comments) {
        throw new BadRequestException("Comments are required for rejection");
      }

      // Step 2: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 3: Determine rejection stage and order
      const rejectionInfo = this.getRejectionStage(existingMember.status);

      // Step 4: Handle committee rejections differently
      if (rejectionInfo.stage === "committee") {
        return this.handleCommitteeRejection(memberId, dto, existingMember, rejectionInfo);
      }

      // Step 5: Validate rejection order is being followed for non-committee rejections
      this.validateRejectionOrder(existingMember, rejectionInfo.order);

      // Step 6: Create rejection history entry
      const rejectionEntry: RejectionHistoryEntry = {
        rejectionStage: rejectionInfo.stage,
        order: rejectionInfo.order,
        rejectedBy: dto.actionBy,
        rejectorEmail: dto.actionByEmail,
        reason: dto.comments,
        rejectedAt: new Date(),
      };

      // Step 7: Update member with rejected status and rejection history
      const updatedMember = await this.updateMemberRejection(memberId, rejectionEntry);

      // Step 8: Send rejection notification
      this.notificationService.sendRejectionNotification(updatedMember, dto.comments);

      this.logger.log(
        `Rejection completed for ${memberId}: ${existingMember.status} → rejected (${rejectionInfo.stage}, order: ${rejectionInfo.order})`,
      );

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.REJECTION,
        message: `Application rejected by ${rejectionInfo.stage}. Reason: ${dto.comments}`,
      };
    } catch (error) {
      this.logger.error(
        `Rejection execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.REJECTION,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get rejection stage and order from current member status
   */
  private getRejectionStage(currentStatus: string): { stage: string; order: number } {
    const stageInfo = this.statusToStageMap[currentStatus];
    if (!stageInfo) {
      this.logger.warn(`Unknown status for rejection: ${currentStatus}, defaulting to 'admin'`);
      return { stage: "admin", order: 0 };
    }
    return stageInfo;
  }

  /**
   * Validate that rejection order is being followed correctly
   * Rules:
   * - Can only reject at the current approval stage
   * - Cannot skip approval stages (must go through previous approvals first)
   * - Admin can reject at any stage (order 0)
   */
  private validateRejectionOrder(member: Member, currentOrder: number): void {
    // Admin rejections (order 0) are always allowed at any stage
    if (currentOrder === 0) {
      return;
    }

    const approvalHistory = member.approvalHistory || [];

    // For committee rejection (order 1): No prior approvals should exist
    if (currentOrder === 1) {
      if (approvalHistory.length > 0) {
        throw new BadRequestException(
          "Invalid rejection: Cannot reject at Committee stage after approvals have been granted. Committee approval has already been completed.",
        );
      }
      return; // Valid: Committee can reject before any approvals
    }

    // For CEO rejection (order 2): Must have committee actions (not necessarily approvals)
    // Since committee allows multiple actions, we check that committee actions exist
    if (currentOrder === 2) {
      const committeeApprovals = approvalHistory.filter((a) => a.order === 1).length;
      const committeeRejections = member.rejectionHistory?.filter((r) => r.order === 1).length || 0;
      const totalCommitteeActions = committeeApprovals + committeeRejections;

      if (totalCommitteeActions === 0) {
        throw new BadRequestException(
          `Invalid rejection order: Cannot reject at CEO stage. No committee actions have been recorded yet.`,
        );
      }
      return; // Valid: CEO can reject after committee actions
    }

    // Ensure we're not rejecting at a stage that's already been passed
    const currentStageApproval = approvalHistory.find((a) => a.order === currentOrder);
    if (currentStageApproval) {
      const currentStageName = this.getStageNameByOrder(currentOrder);
      throw new BadRequestException(
        `Invalid rejection: ${currentStageName} has already approved this application. Cannot reject at this stage.`,
      );
    }
  }

  /**
   * Get stage name by order number
   */
  private getStageNameByOrder(order: number): string {
    switch (order) {
      case 0:
        return "Admin";
      case 1:
        return "Committee";
      case 2:
        return "CEO";
      default:
        return "Unknown";
    }
  }

  /**
   * Update member with rejection
   */
  private async updateMemberRejection(
    memberId: string,
    rejectionEntry: RejectionHistoryEntry,
  ): Promise<Member> {
    await this.memberRepository.updateOne(
      { memberId },
      {
        $set: { status: "rejected" },
        $push: { rejectionHistory: rejectionEntry },
      },
    );

    const updatedMember = await this.memberRepository.findOne({ memberId });
    if (!updatedMember) {
      throw new NotFoundException(`Member with ID ${memberId} not found after rejection`);
    }

    return updatedMember;
  }

  /**
   * Handle committee rejection - record feedback but don't reject application
   */
  private async handleCommitteeRejection(
    memberId: string,
    dto: UpdateStatusDto,
    existingMember: Member,
    rejectionInfo: { stage: string; order: number },
  ): Promise<MemberWorkflowResult> {
    // Step 1: Check if this user has already acted at committee stage
    const existingAction = (existingMember.approvalHistory || []).find((a) =>
      a.order === rejectionInfo.order &&
      a.approverEmail === dto.actionByEmail
    ) || (existingMember.rejectionHistory || []).find((r) =>
      r.order === rejectionInfo.order &&
      r.rejectorEmail === dto.actionByEmail
    );

    if (existingAction) {
      throw new BadRequestException("You have already provided feedback for this application at the committee stage");
    }

    // Step 2: Create rejection history entry for committee feedback
    const rejectionEntry: RejectionHistoryEntry = {
      rejectionStage: rejectionInfo.stage,
      order: rejectionInfo.order,
      rejectedBy: dto.actionBy,
      rejectorEmail: dto.actionByEmail,
      reason: dto.comments || "",
      rejectedAt: new Date(),
    };

    // Step 2: Check if required committee actions are met
    const requiredActions = this.configService.get<number>("REQUIRED_COMMITTEE_ACTIONS", 2);
    const currentCommitteeApprovals = (existingMember.approvalHistory || []).filter(
      (a) => a.approvalStage === "committee",
    ).length;
    const currentCommitteeRejections = (existingMember.rejectionHistory || []).filter(
      (r) => r.rejectionStage === "committee",
    ).length;
    const totalCommitteeActions = currentCommitteeApprovals + currentCommitteeRejections;

    let nextStatus = existingMember.status;
    let nextPhase: string | undefined;

    if (totalCommitteeActions + 1 >= requiredActions) {
      // Required actions met, transition to CEO approval
      const transition = await this.workflowTransitionRepository.getTransition(
        WorkflowType.MEMBER_ONBOARDING,
        existingMember.status,
      );
      if (transition) {
        nextStatus = transition.nextStatus;
        nextPhase = transition.phase;
        this.logger.log(
          `Committee action threshold met for ${memberId}: ${totalCommitteeActions + 1}/${requiredActions} actions, transitioning to ${nextStatus}`,
        );
      }
    } else {
      this.logger.log(
        `Committee rejection recorded for ${memberId}: ${totalCommitteeActions + 1}/${requiredActions} actions`,
      );
    }

    // Step 3: Update member with rejection history and potentially new status
    await this.memberRepository.updateOne(
      { memberId },
      {
        $set: { status: nextStatus },
        $push: { rejectionHistory: rejectionEntry },
      },
    );

    const updatedMember = await this.memberRepository.findOne({ memberId });
    if (!updatedMember) {
      throw new NotFoundException(`Member with ID ${memberId} not found after committee rejection`);
    }

    // Step 4: Send notification only if status changed
    if (nextStatus !== existingMember.status) {
      this.notificationService.sendApprovalNotification(
        updatedMember,
        "committee",
      );
    }

    return {
      success: true,
      entity: updatedMember,
      phase: MemberWorkflowPhases.REJECTION,
      nextPhase,
      message: `Committee feedback recorded. ${totalCommitteeActions + 1}/${requiredActions} actions collected.`,
    };
  }
}

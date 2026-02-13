import { Injectable, BadRequestException } from "@nestjs/common";
import { BaseWorkflowOrchestrator } from "@shared/workflow";
import {
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import {
  Phase1Handler,
  Phase2Handler,
  Phase3Handler,
  ApprovalHandler,
  RejectionHandler,
  PaymentHandler,
} from "../handlers";
import { CreateMemberDto } from "../../dto/create-member.dto";
import { UpdateMemberDto } from "../../dto/update-member.dto";
import {
  UpdateStatusDto,
  UpdatePaymentLinkDto,
  UpdatePaymentStatusDto,
} from "../../dto/approval-workflow.dto";
import { Member } from "../../schemas/member.schema";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";
import { MemberRepository } from "../../repository/member.repository";

/**
 * Workflow Orchestrator for Member Onboarding
 *
 * Central coordinator for all member onboarding workflow phases
 * Routes workflow requests to appropriate handlers based on phase
 * Extends BaseWorkflowOrchestrator for common workflow patterns
 *
 * Design Benefits:
 * - Single entry point for all workflow operations
 * - Handlers are independent and testable
 * - Easy to add new phases without modifying existing code
 * - Supports future automation by swapping handler implementations
 * - Reuses shared workflow framework for consistency
 */
@Injectable()
export class WorkflowOrchestrator extends BaseWorkflowOrchestrator<Member, string> {
  constructor(
    private readonly phase1Handler: Phase1Handler,
    private readonly phase2Handler: Phase2Handler,
    private readonly phase3Handler: Phase3Handler,
    private readonly approvalHandler: ApprovalHandler,
    private readonly rejectionHandler: RejectionHandler,
    private readonly paymentHandler: PaymentHandler,
    workflowTransitionRepository: WorkflowTransitionRepository,
    private readonly memberRepository: MemberRepository,
  ) {
    super(WorkflowType.MEMBER_ONBOARDING, WorkflowOrchestrator.name, workflowTransitionRepository);
  }

  /**
   * Extract status from member entity (required by BaseWorkflowOrchestrator)
   */
  protected getEntityStatus(entity: Member): string {
    return entity.status;
  }

  /**
   * Execute Phase 1: Initial Application Submission
   */
  async executePhase1(dto: CreateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log("Orchestrating Phase 1: Initial Application");

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PHASE_1_APPLICATION,
      data: dto,
    };

    if (!this.phase1Handler.canHandle(context)) {
      throw new BadRequestException("Phase 1 handler cannot process this request");
    }

    return this.phase1Handler.handle(context);
  }

  /**
   * Execute Phase 2: Application Completion (NO user additions)
   */
  async executePhase2(memberId: string, dto: UpdateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Phase 2: Completion for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PHASE_2_COMPLETION,
      entityId: memberId,
      data: dto,
    };

    if (!this.phase2Handler.canHandle(context)) {
      throw new BadRequestException("Phase 2 handler cannot process this request");
    }

    return this.phase2Handler.handle(context);
  }

  /**
   * Execute Phase 3: Post-Approval Updates (add users, questionnaires)
   */
  async executePhase3(memberId: string, dto: UpdateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Phase 3: Post-Approval Updates for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PHASE_2_COMPLETION, // Using existing phase
      entityId: memberId,
      data: dto,
    };

    return this.phase3Handler.handle(context);
  }

  /**
   * Execute Approval (Committee, Board, or CEO)
   * Phase is determined from database based on member's current status
   */
  async executeApproval(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Approval for ${memberId}`);

    // Get member to determine current status
    const member = await this.memberRepository.findOne({ memberId });
    if (!member) {
      throw new BadRequestException(`Member with ID ${memberId} not found`);
    }

    // Get approval phase from database based on current status
    const phase = await this.getApprovalPhaseFromStatus(member.status);
    console.log("Determined approval phase:", phase);
    const context: MemberWorkflowContext = {
      phase,
      entityId: memberId,
      data: dto,
    };

    if (!this.approvalHandler.canHandle(context)) {
      throw new BadRequestException("Approval handler cannot process this request");
    }

    return this.approvalHandler.handle(context);
  }

  /**
   * Execute Rejection (at any stage)
   */
  async executeRejection(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Rejection for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.REJECTION,
      entityId: memberId,
      data: dto,
    };

    if (!this.rejectionHandler.canHandle(context)) {
      throw new BadRequestException("Rejection handler cannot process this request");
    }

    return this.rejectionHandler.handle(context);
  }

  /**
   * Add Payment Link
   */
  async addPaymentLink(memberId: string, dto: UpdatePaymentLinkDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Payment Link addition for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PAYMENT_LINK,
      entityId: memberId,
      data: dto,
    };

    if (!this.paymentHandler.canHandle(context)) {
      throw new BadRequestException("Payment handler cannot process payment link request");
    }

    return this.paymentHandler.handle(context);
  }

  /**
   * Complete Payment and Activate Membership
   */
  async completePayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Payment Completion for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PAYMENT_COMPLETION,
      entityId: memberId,
      data: dto,
    };

    if (!this.paymentHandler.canHandle(context)) {
      throw new BadRequestException("Payment handler cannot process payment completion request");
    }

    return this.paymentHandler.handle(context);
  }

  /**
   * Reset Payment Info
   */
  async resetPayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult> {
    this.logger.log(`Orchestrating Payment Reset for ${memberId}`);

    const context: MemberWorkflowContext = {
      phase: MemberWorkflowPhases.PAYMENT_RESET,
      entityId: memberId,
      data: dto,
    };

    if (!this.paymentHandler.canHandle(context)) {
      throw new BadRequestException("Payment handler cannot process payment reset request");
    }

    return this.paymentHandler.handle(context);
  }

  /**
   * Get approval phase from current status (Database-Driven)
   * Uses inherited getPhaseFromStatus() method
   */
  private async getApprovalPhaseFromStatus(currentStatus: string): Promise<string> {
    return this.getPhaseFromStatus(currentStatus);
  }
}

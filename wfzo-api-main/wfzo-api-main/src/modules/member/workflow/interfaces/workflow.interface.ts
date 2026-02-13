import { Member } from "../../schemas/member.schema";
import { CreateMemberDto } from "../../dto/create-member.dto";
import { UpdateMemberDto } from "../../dto/update-member.dto";
import {
  UpdateStatusDto,
  UpdatePaymentLinkDto,
  UpdatePaymentStatusDto,
} from "../../dto/approval-workflow.dto";
import { BaseWorkflowContext, BaseWorkflowResult, IBaseWorkflowHandler } from "@shared/workflow";

/**
 * Member workflow phase constants (Database-Driven)
 * These are stored in WorkflowTransition collection - use for type safety only
 * DO NOT use these for logic - always query from database
 */
export const MemberWorkflowPhases = {
  PHASE_1_APPLICATION: "PHASE_1_APPLICATION",
  PHASE_2_COMPLETION: "PHASE_2_COMPLETION",
  COMMITTEE_APPROVAL: "COMMITTEE_APPROVAL",
  BOARD_APPROVAL: "BOARD_APPROVAL",
  CEO_APPROVAL: "CEO_APPROVAL",
  PAYMENT_LINK: "PAYMENT_LINK",
  PAYMENT_COMPLETION: "PAYMENT_COMPLETION",
  PAYMENT_RESET: "PAYMENT_RESET",
  REJECTION: "REJECTION",
} as const;

export type MemberWorkflowPhase = (typeof MemberWorkflowPhases)[keyof typeof MemberWorkflowPhases];

/**
 * Member-specific workflow context (alias for type safety)
 */
export type MemberWorkflowContext = BaseWorkflowContext<
  | CreateMemberDto
  | UpdateMemberDto
  | UpdateStatusDto
  | UpdatePaymentLinkDto
  | UpdatePaymentStatusDto,
  {
    adminId?: string;
    adminEmail?: string;
    timestamp?: Date;
    [key: string]: unknown;
  }
>;

/**
 * Member-specific workflow result (alias for type safety)
 */
export type MemberWorkflowResult = BaseWorkflowResult<Member>;

/**
 * Phase 1 handler interface
 */
export interface IPhase1Handler
  extends IBaseWorkflowHandler<MemberWorkflowContext, MemberWorkflowResult> {
  execute(dto: CreateMemberDto): Promise<MemberWorkflowResult>;
}

/**
 * Phase 2 handler interface
 */
export interface IPhase2Handler
  extends IBaseWorkflowHandler<MemberWorkflowContext, MemberWorkflowResult> {
  execute(memberId: string, dto: UpdateMemberDto): Promise<MemberWorkflowResult>;
}

/**
 * Approval handler interface
 */
export interface IApprovalHandler
  extends IBaseWorkflowHandler<MemberWorkflowContext, MemberWorkflowResult> {
  execute(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult>;
}

/**
 * Rejection handler interface
 */
export interface IRejectionHandler
  extends IBaseWorkflowHandler<MemberWorkflowContext, MemberWorkflowResult> {
  execute(memberId: string, dto: UpdateStatusDto): Promise<MemberWorkflowResult>;
}

/**
 * Payment handler interface
 */
export interface IPaymentHandler
  extends IBaseWorkflowHandler<MemberWorkflowContext, MemberWorkflowResult> {
  executeAddPaymentLink(memberId: string, dto: UpdatePaymentLinkDto): Promise<MemberWorkflowResult>;
  executeCompletePayment(
    memberId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<MemberWorkflowResult>;
}

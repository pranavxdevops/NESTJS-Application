import {
  IWorkflowValidator,
  BaseValidationContext,
  ValidationResult,
  BaseValidator,
} from "@shared/workflow";
import { Member } from "../../schemas/member.schema";

/**
 * Member-specific validation context
 * Extends base context with member-specific transition information
 */
export interface MemberValidationContext extends BaseValidationContext<Member> {
  currentUserEmail?: string;
  transition?: {
    nextStatus: string;
    phase: string;
    approvalStage: string;
    order: number;
  };
}

/**
 * Convenience accessor for member entity
 * Allows validators to use context.member instead of context.entity
 */
export type MemberValidationContextWithMember = MemberValidationContext & {
  member: Member;
};

/**
 * Re-export shared validator types for backward compatibility
 */
export type { IWorkflowValidator, ValidationResult };

/**
 * Base class for member workflow validators
 * Extends shared BaseValidator with member-specific context
 */
export abstract class BaseWorkflowValidator extends BaseValidator<MemberValidationContext> {}

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Workflow types supported in the system
 */
export enum WorkflowType {
  MEMBER_ONBOARDING = "memberOnboarding",
  // Future workflows can be added here
  // MEMBER_RENEWAL = "memberRenewal",
  // EVENT_REGISTRATION = "eventRegistration",
}

/**
 * WorkflowTransition - Database-driven workflow configuration
 *
 * This schema defines the valid status transitions for different workflows.
 * Each transition represents a step in the workflow with:
 * - Current status (what status triggers this transition)
 * - Next status (what status to move to after approval)
 * - Approval stage metadata
 * - Sequential order enforcement
 *
 * NOTE: The 'phase' field stores WorkflowPhase enum values directly from
 * workflow.interface.ts (e.g., "COMMITTEE_APPROVAL", "BOARD_APPROVAL")
 */
@Schema({
  collection: "workflowTransitions",
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class WorkflowTransition {
  @Prop({ required: true, enum: WorkflowType, index: true })
  workflowType!: WorkflowType; // e.g., "memberOnboarding"

  @Prop({ required: true, index: true })
  currentStatus!: string; // e.g., "pendingCommitteeApproval"

  @Prop({ required: true })
  nextStatus!: string; // e.g., "pendingBoardApproval"

  @Prop({ required: true })
  phase!: string; // Stores WorkflowPhase enum value (e.g., "COMMITTEE_APPROVAL")

  @Prop({ required: true })
  approvalStage!: string; // e.g., "committee", "board", "ceo"

  @Prop({ required: true, min: 1 })
  order!: number; // Sequential order: 1, 2, 3, ...

  @Prop({ default: true })
  isActive!: boolean; // Allow disabling transitions without deleting

  @Prop()
  description?: string; // Human-readable description of this transition

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // Soft delete
}

export type WorkflowTransitionDocument = WorkflowTransition & Document;
export const WorkflowTransitionSchema = SchemaFactory.createForClass(WorkflowTransition);

// Compound index for efficient querying
WorkflowTransitionSchema.index({ workflowType: 1, currentStatus: 1 });
WorkflowTransitionSchema.index({ workflowType: 1, order: 1 });
WorkflowTransitionSchema.index({ isActive: 1, deletedAt: 1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {
  OrganisationInfo,
  OrganisationQuestionnaire,
  Address,
  SocialMediaHandle,
} from "@modules/member/schemas/member.schema";

export type RequestDocument = HydratedDocument<Request>;

export enum RequestStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/**
 * Request collection for handling organizationInfo update requests
 * with admin approval workflow
 */
@Schema({ timestamps: true })
export class Request {
  /**
   * Copy of organizationInfo from member - user submits this
   * Uses same structure as OrganisationInfo from Member schema
   */
  @Prop({ type: Object, required: true })
  organisationInfo!: Record<string, any>; // Flexible object to match OrganisationInfo structure

  /**
   * Member ID who is requesting the update
   * Must exist in members collection
   */
  @Prop({ required: true })
  memberId!: string;

  /**
   * Status of the request
   * Default: PENDING
   * Admin can change to APPROVED or REJECTED
   */
  @Prop({
    required: true,
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  requestStatus!: RequestStatus;

  /**
   * Comments/reason for approval or rejection
   * Required when requestStatus is APPROVED or REJECTED
   * Should be empty/null when PENDING
   */
  @Prop({ type: String, default: null })
  comments?: string | null;

  /**
   * Soft-delete timestamp for logical deletion
   * Part of BaseRepository pattern
   */
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  // Timestamps: createdAt and updatedAt are added by @Schema({ timestamps: true })
}

export const RequestSchema = SchemaFactory.createForClass(Request);

// Create indexes for common queries
RequestSchema.index({ memberId: 1 });
RequestSchema.index({ requestStatus: 1 });
RequestSchema.index({ memberId: 1, requestStatus: 1 });
RequestSchema.index({ createdAt: -1 });

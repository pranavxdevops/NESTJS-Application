import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EnquiryDocument = HydratedDocument<Enquiry>;

@Schema({ _id: false })
export class UserDetails {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true })
  organizationName!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: true })
  email!: string;
}

export enum EnquiryType {
  BECOME_FEATURED_MEMBER = "become_featured_member",
  SUBMIT_QUESTION = "submit_question",
  LEARN_MORE = "learn_more",
  CONSULTANCY_NEEDS = "consultancy_needs",
  REQUEST_ADDITIONAL_TEAM_MEMBERS = "request_additional_team_members",
}

export enum EnquiryStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Schema({ timestamps: true })
export class Enquiry {
  @Prop({ type: UserDetails, required: false })
  userDetails?: UserDetails;

  @Prop({ type: String, enum: EnquiryType, required: false })
  enquiryType?: EnquiryType;

  @Prop({ required: false })
  subject?: string; // Only for SUBMIT_QUESTION

  @Prop({ required: false })
  message?: string;

  @Prop({ enum: EnquiryStatus, default: EnquiryStatus.PENDING })
  enquiryStatus?: EnquiryStatus;

  @Prop({ required: false })
  noOfMembers?: number;

  @Prop({ required: false })
  comments?: string;

  @Prop({ required: false })
  memberId?: string; // Reference to member ID from members collection (e.g., "MEMBER-008")

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);
EnquirySchema.index({ "userDetails.email": 1 }); // For quick lookup by email
EnquirySchema.index({ enquiryType: 1 });
EnquirySchema.index({ enquiryStatus: 1 });
EnquirySchema.index({ noOfMembers: 1 });
EnquirySchema.index({ createdAt: -1 });

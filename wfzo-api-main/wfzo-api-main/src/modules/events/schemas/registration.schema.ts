import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as MongooseDocument } from "mongoose";

export type RegistrationDocument = Registration & MongooseDocument;

export type RegistrationStatus = "confirmed" | "waitlisted" | "pendingPayment" | "cancelled";

@Schema({ _id: false })
export class AttendeeInfo {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: false })
  organization?: string;

  @Prop({ required: false })
  jobTitle?: string;

  @Prop({ required: false })
  phone?: string;
}

const AttendeeInfoSchema = SchemaFactory.createForClass(AttendeeInfo);

@Schema({ timestamps: true, collection: "event_registrations" })
export class Registration {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, index: true })
  eventCode!: string;

  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: false, index: true })
  membershipId?: string;

  @Prop({ required: false, index: true })
  userId?: string;

  @Prop({ required: true, type: AttendeeInfoSchema })
  attendee!: AttendeeInfo;

  @Prop({ required: true, enum: ["confirmed", "waitlisted", "pendingPayment", "cancelled"] })
  status!: RegistrationStatus;

  @Prop({ required: false })
  zoomRegistrantId?: string;

  @Prop({ required: false })
  joinUrl?: string;

  @Prop({ required: false })
  cancelReason?: string;

  @Prop({ required: false, type: Date })
  cancelledAt?: Date;

  @Prop({ required: false, type: Date })
  checkInAt?: Date;

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>;

  @Prop({ required: false, type: Date })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);

// Add indexes for common queries
// Unique indexes are created by migration 001-database-indexes.migration.ts
// RegistrationSchema.index({ id: 1 }, { unique: true });
RegistrationSchema.index({ eventCode: 1, status: 1 });
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ membershipId: 1, eventCode: 1 });
RegistrationSchema.index({ userId: 1, eventCode: 1 });
RegistrationSchema.index({ "attendee.email": 1, eventCode: 1 });
RegistrationSchema.index({ createdAt: -1 });

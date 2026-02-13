import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as MongooseDocument } from "mongoose";

export type EventDocument = Event & MongooseDocument;

export type EventType = "webinar" | "event";
export type EventStatus = "draft" | "scheduled" | "ongoing" | "completed" | "cancelled";

@Schema({ _id: false })
export class EventPresenter {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: false })
  bio?: string;
}

const EventPresenterSchema = SchemaFactory.createForClass(EventPresenter);

@Schema({ _id: false })
export class EventCreator {
  @Prop({ required: true, enum: ["wfzo", "member"] })
  type!: "wfzo" | "member";

  @Prop({ required: false })
  memberId?: string;

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: false })
  memberName?: string;
}

const EventCreatorSchema = SchemaFactory.createForClass(EventCreator);

@Schema({ _id: false })
export class RegistrationSettings {
  @Prop({ required: false, type: Boolean, default: false })
  requiresApproval?: boolean;

  @Prop({ required: false, type: Date })
  registrationDeadline?: Date;

  @Prop({ required: false, type: Boolean, default: true })
  allowWaitlist?: boolean;
}

const RegistrationSettingsSchema = SchemaFactory.createForClass(RegistrationSettings);

@Schema({ _id: false })
export class ZoomMeetingSettings {
  @Prop({ required: false, type: Boolean, default: true })
  hostVideo?: boolean;

  @Prop({ required: false, type: Boolean, default: true })
  participantVideo?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  muteUponEntry?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  waitingRoom?: boolean;

  @Prop({ required: false, enum: ["none", "local", "cloud"], default: "none" })
  autoRecording?: "none" | "local" | "cloud";
}

const ZoomMeetingSettingsSchema = SchemaFactory.createForClass(ZoomMeetingSettings);

@Schema({ _id: false })
export class ZoomSettings {
  @Prop({ required: true, type: Boolean })
  autoCreate!: boolean;

  @Prop({ required: false, enum: ["webinar", "event"] })
  type?: "webinar" | "event";

  @Prop({ required: false, type: ZoomMeetingSettingsSchema })
  settings?: ZoomMeetingSettings;
}

const ZoomSettingsSchema = SchemaFactory.createForClass(ZoomSettings);

@Schema({ _id: false })
export class ZoomDetails {
  @Prop({ required: false })
  meetingId?: string;

  @Prop({ required: false })
  webinarId?: string;

  @Prop({ required: false })
  hostJoinUrl?: string;

  @Prop({ required: false })
  registrationUrl?: string;

  @Prop({ required: false })
  password?: string;
}

const ZoomDetailsSchema = SchemaFactory.createForClass(ZoomDetails);

@Schema({ timestamps: true, collection: "events" })
export class Event {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  eventCode!: string;

  @Prop({ required: true, enum: ["webinar", "event"] })
  type!: EventType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, type: Date })
  scheduledAt!: Date;

  @Prop({ required: true, type: Number })
  durationMinutes!: number;

  @Prop({ required: false, default: "UTC" })
  timezone?: string;

  @Prop({ required: true, type: EventPresenterSchema })
  presenter!: EventPresenter;

  @Prop({ required: true, type: Number })
  capacity!: number;

  @Prop({ required: false, default: "en" })
  language?: string;

  @Prop({ required: true, enum: ["draft", "scheduled", "ongoing", "completed", "cancelled"] })
  status!: EventStatus;

  @Prop({ required: true, type: EventCreatorSchema })
  createdBy!: EventCreator;

  @Prop({ required: false, type: RegistrationSettingsSchema })
  registrationSettings?: RegistrationSettings;

  @Prop({ required: false, type: ZoomSettingsSchema })
  zoom?: ZoomSettings;

  @Prop({ required: false, type: ZoomDetailsSchema })
  zoomDetails?: ZoomDetails;

  @Prop({ required: false })
  externalUrl?: string;

  @Prop({ required: false })
  externalRegistrationUrl?: string;

  @Prop({ required: false })
  cancelReason?: string;

  @Prop({ required: false, type: Date })
  cancelledAt?: Date;

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>;

  @Prop({ required: false, type: Date })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes are created by migration 001-database-indexes.migration.ts
// EventSchema.index({ eventCode: 1 }, { unique: true });
// EventSchema.index({ id: 1 }, { unique: true });
EventSchema.index({ status: 1, scheduledAt: 1 });
EventSchema.index({ "createdBy.memberId": 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ scheduledAt: 1 });
EventSchema.index({ createdAt: -1 });
EventSchema.index({ title: "text", description: "text" });

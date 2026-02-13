import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Enums
export enum EventType {
   WEBINAR = "webinar",
   EVENT = "event",
}

export enum EventStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum RegistrationStatus {
  CONFIRMED = "confirmed",
  WAITLISTED = "waitlisted",
  PENDING_PAYMENT = "pendingPayment",
  CANCELLED = "cancelled",
}

export enum AutoRecordingType {
  NONE = "none",
  LOCAL = "local",
  CLOUD = "cloud",
}

// Nested DTOs
export class EventPresenterDto {
  @ApiProperty({ description: "Presenter full name", example: "Dr. Jane Smith" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Presenter email", example: "jane@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ description: "Presenter biography" })
  @IsString()
  @IsOptional()
  bio?: string;
}

export class EventCreatorDto {
  @ApiProperty({ enum: ["wfzo", "member"], description: "Creator type" })
  @IsEnum(["wfzo", "member"])
  type!: "wfzo" | "member";

  @ApiPropertyOptional({ description: "Member ID if creator is member" })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ description: "User ID of creator" })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: "Member organization name" })
  @IsString()
  @IsOptional()
  memberName?: string;
}

export class RegistrationSettingsDto {
  @ApiPropertyOptional({ description: "Requires admin approval", default: false })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: "Registration deadline", example: "2025-11-14T23:59:59Z" })
  @IsDateString()
  @IsOptional()
  registrationDeadline?: string;

  @ApiPropertyOptional({ description: "Allow waitlist when full", default: true })
  @IsBoolean()
  @IsOptional()
  allowWaitlist?: boolean;
}

export class ZoomMeetingSettingsDto {
  @ApiPropertyOptional({ description: "Enable host video", default: true })
  @IsBoolean()
  @IsOptional()
  hostVideo?: boolean;

  @ApiPropertyOptional({ description: "Enable participant video", default: true })
  @IsBoolean()
  @IsOptional()
  participantVideo?: boolean;

  @ApiPropertyOptional({ description: "Mute upon entry", default: false })
  @IsBoolean()
  @IsOptional()
  muteUponEntry?: boolean;

  @ApiPropertyOptional({ description: "Enable waiting room", default: false })
  @IsBoolean()
  @IsOptional()
  waitingRoom?: boolean;

  @ApiPropertyOptional({
    enum: AutoRecordingType,
    description: "Auto recording type",
    default: "none",
  })
  @IsEnum(AutoRecordingType)
  @IsOptional()
  autoRecording?: AutoRecordingType;
}

export class ZoomSettingsDto {
  @ApiProperty({ description: "Auto-create Zoom meeting/webinar" })
  @IsBoolean()
  autoCreate!: boolean;

  @ApiPropertyOptional({ enum: EventType, description: "Zoom meeting type" })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional({ type: ZoomMeetingSettingsDto, description: "Zoom meeting settings" })
  @ValidateNested()
  @Type(() => ZoomMeetingSettingsDto)
  @IsOptional()
  settings?: ZoomMeetingSettingsDto;
}

export class ZoomDetailsDto {
  @ApiPropertyOptional({ description: "Zoom meeting ID" })
  @IsString()
  @IsOptional()
  meetingId?: string;

  @ApiPropertyOptional({ description: "Zoom webinar ID" })
  @IsString()
  @IsOptional()
  webinarId?: string;

  @ApiPropertyOptional({ description: "Host join URL" })
  @IsString()
  @IsOptional()
  hostJoinUrl?: string;

  @ApiPropertyOptional({ description: "Registration URL" })
  @IsString()
  @IsOptional()
  registrationUrl?: string;

  @ApiPropertyOptional({ description: "Meeting password" })
  @IsString()
  @IsOptional()
  password?: string;
}

export class AttendeeInfoDto {
  @ApiProperty({ description: "First name", example: "Aisha" })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: "Last name", example: "Khan" })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ description: "Email address", example: "aisha@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ description: "Organization name", example: "Alpha Free Zone" })
  @IsString()
  @IsOptional()
  organization?: string;

  @ApiPropertyOptional({ description: "Job title", example: "Director" })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ description: "Phone number", example: "+971501234567" })
  @IsString()
  @IsOptional()
  phone?: string;
}

// Request DTOs
export class EventCreateRequest {
  @ApiProperty({ description: "Unique event code", example: "WFZO-2025-DXB" })
  @IsString()
  @IsNotEmpty()
  eventCode!: string;

  @ApiProperty({ enum: EventType, description: "Event type" })
  @IsEnum(EventType)
  type!: EventType;

  @ApiProperty({ description: "Event title", example: "Innovations in Aerospace" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "Event description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Scheduled date and time", example: "2025-11-15T14:00:00Z" })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ description: "Duration in minutes", example: 60 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional({ description: "Timezone", example: "Asia/Dubai", default: "UTC" })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ type: EventPresenterDto, description: "Presenter details" })
  @ValidateNested()
  @Type(() => EventPresenterDto)
  presenter!: EventPresenterDto;

  @ApiProperty({ description: "Event capacity", example: 500 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ description: "Language code", example: "en", default: "en" })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ type: EventCreatorDto, description: "Event creator details" })
  @ValidateNested()
  @Type(() => EventCreatorDto)
  createdBy!: EventCreatorDto;

  @ApiPropertyOptional({ type: RegistrationSettingsDto, description: "Registration settings" })
  @ValidateNested()
  @Type(() => RegistrationSettingsDto)
  @IsOptional()
  registrationSettings?: RegistrationSettingsDto;

  @ApiPropertyOptional({ type: ZoomSettingsDto, description: "Zoom integration settings" })
  @ValidateNested()
  @Type(() => ZoomSettingsDto)
  @IsOptional()
  zoom?: ZoomSettingsDto;

  @ApiPropertyOptional({ description: "External meeting URL (if not using Zoom)" })
  @IsString()
  @IsOptional()
  externalUrl?: string;

  @ApiPropertyOptional({ description: "External registration URL (if not using Zoom)" })
  @IsString()
  @IsOptional()
  externalRegistrationUrl?: string;
}

export class EventUpdateRequest {
  @ApiPropertyOptional({ description: "Event title" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: "Event description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Scheduled date and time" })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: "Duration in minutes" })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ type: EventPresenterDto, description: "Presenter details" })
  @ValidateNested()
  @Type(() => EventPresenterDto)
  @IsOptional()
  presenter?: EventPresenterDto;

  @ApiPropertyOptional({ description: "Event capacity" })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}

export class EventCancelRequest {
  @ApiProperty({ description: "Cancellation reason" })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: "Send notification to attendees", default: true })
  @IsBoolean()
  @IsOptional()
  notifyAttendees?: boolean;
}

export class EventRegistrationRequest {
  @ApiProperty({ description: "Event code", example: "WFZO-2025-DXB" })
  @IsString()
  @IsNotEmpty()
  eventCode!: string;

  @ApiPropertyOptional({ description: "Membership ID" })
  @IsString()
  @IsOptional()
  membershipId?: string;

  @ApiProperty({ type: [AttendeeInfoDto], description: "List of attendees to register" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeInfoDto)
  attendees!: AttendeeInfoDto[];

  @ApiProperty({ description: "User consent for registration" })
  @IsBoolean()
  consent!: boolean;
}

// Response DTOs
export class EventCreateResponse {
  @ApiProperty({ description: "Event ID" })
  id!: string;

  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ enum: EventStatus, description: "Event status" })
  status!: EventStatus;

  @ApiPropertyOptional({ type: ZoomDetailsDto, description: "Zoom meeting details" })
  zoom?: ZoomDetailsDto;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt!: string;
}

export class AttendeeRegistrationDto {
  @ApiProperty({ description: "Attendee ID" })
  attendeeId!: string;

  @ApiProperty({ description: "Email address" })
  email!: string;

  @ApiProperty({ enum: RegistrationStatus, description: "Registration status" })
  status!: RegistrationStatus;

  @ApiProperty({ description: "First name" })
  firstName!: string;

  @ApiProperty({ description: "Last name" })
  lastName!: string;

  @ApiPropertyOptional({ description: "Unique Zoom join URL" })
  joinUrl?: string;

  @ApiPropertyOptional({ description: "Zoom registrant ID" })
  zoomRegistrantId?: string;
}

export class EventRegistrationResponse {
  @ApiProperty({ description: "Registration ID" })
  registrationId!: string;

  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ enum: RegistrationStatus, description: "Overall registration status" })
  status!: RegistrationStatus;

  @ApiProperty({ type: [AttendeeRegistrationDto], description: "Individual registrations" })
  registrations!: AttendeeRegistrationDto[];

  @ApiPropertyOptional({ description: "Additional message" })
  message?: string;
}

export class MyRegistrationResponse {
  @ApiProperty({ description: "Whether user is registered" })
  registered!: boolean;

  @ApiPropertyOptional({ description: "Registration ID" })
  registrationId?: string;

  @ApiPropertyOptional({ enum: RegistrationStatus, description: "Registration status" })
  status?: RegistrationStatus;

  @ApiPropertyOptional({ description: "Attendee details" })
  attendee?: AttendeeInfoDto;

  @ApiPropertyOptional({ description: "Unique join URL" })
  joinUrl?: string;

  @ApiPropertyOptional({ description: "Zoom registrant ID" })
  zoomRegistrantId?: string;

  @ApiPropertyOptional({ description: "Registration timestamp" })
  registeredAt?: string;
}

export class EventListItemDto {
  @ApiProperty({ description: "Event ID" })
  id!: string;

  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ description: "Event title" })
  title!: string;

  @ApiProperty({ description: "Scheduled date and time" })
  scheduledAt!: string;

  @ApiProperty({ enum: EventType, description: "Event type" })
  type!: EventType;

  @ApiProperty({ description: "Event capacity" })
  capacity!: number;

  @ApiProperty({ enum: EventStatus, description: "Event status" })
  status!: EventStatus;

  @ApiProperty({ type: EventPresenterDto, description: "Presenter details" })
  presenter!: EventPresenterDto;

  @ApiProperty({ type: EventCreatorDto, description: "Creator details" })
  createdBy!: EventCreatorDto;

  @ApiProperty({ description: "Number of registrations" })
  registrationCount!: number;
}

export class PageData {
  @ApiProperty({ description: "Total number of items" })
  total!: number;

  @ApiProperty({ description: "Current page number" })
  page!: number;

  @ApiProperty({ description: "Items per page" })
  pageSize!: number;
}

export class EventListResponse {
  @ApiProperty({ type: [EventListItemDto], description: "List of events" })
  items!: EventListItemDto[];

  @ApiProperty({ type: PageData, description: "Pagination metadata" })
  page!: PageData;
}

export class EventDetailsDto {
  @ApiProperty({ description: "Event ID" })
  id!: string;

  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ enum: EventType, description: "Event type" })
  type!: EventType;

  @ApiProperty({ description: "Event title" })
  title!: string;

  @ApiPropertyOptional({ description: "Event description" })
  description?: string;

  @ApiProperty({ description: "Scheduled date and time" })
  scheduledAt!: string;

  @ApiProperty({ description: "Duration in minutes" })
  durationMinutes!: number;

  @ApiPropertyOptional({ description: "Timezone" })
  timezone?: string;

  @ApiProperty({ type: EventPresenterDto, description: "Presenter details" })
  presenter!: EventPresenterDto;

  @ApiProperty({ description: "Event capacity" })
  capacity!: number;

  @ApiPropertyOptional({ description: "Language code" })
  language?: string;

  @ApiProperty({ enum: EventStatus, description: "Event status" })
  status!: EventStatus;

  @ApiProperty({ type: EventCreatorDto, description: "Creator details" })
  createdBy!: EventCreatorDto;

  @ApiPropertyOptional({ type: RegistrationSettingsDto, description: "Registration settings" })
  registrationSettings?: RegistrationSettingsDto;

  @ApiPropertyOptional({ type: ZoomDetailsDto, description: "Zoom meeting details" })
  zoomDetails?: ZoomDetailsDto;

  @ApiPropertyOptional({ description: "External meeting URL" })
  externalUrl?: string;

  @ApiPropertyOptional({ description: "External registration URL" })
  externalRegistrationUrl?: string;

  @ApiProperty({ description: "Number of confirmed registrations" })
  registrationCount!: number;

  @ApiProperty({ description: "Available seats" })
  availableSeats!: number;

  @ApiProperty({ description: "Whether registration is open" })
  registrationOpen!: boolean;

  @ApiPropertyOptional({ description: "User is registered" })
  userRegistered?: boolean;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt!: string;

  @ApiProperty({ description: "Update timestamp" })
  updatedAt!: string;
}

export class EventAttendeeDto {
  @ApiProperty({ description: "Registration ID" })
  registrationId!: string;

  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ type: AttendeeInfoDto, description: "Attendee details" })
  attendee!: AttendeeInfoDto;

  @ApiPropertyOptional({ description: "Membership ID" })
  membershipId?: string;

  @ApiProperty({ enum: RegistrationStatus, description: "Registration status" })
  status!: RegistrationStatus;

  @ApiProperty({ description: "Registration timestamp" })
  registeredAt!: string;

  @ApiPropertyOptional({ description: "Cancellation timestamp" })
  cancelledAt?: string;

  @ApiPropertyOptional({ description: "Cancellation reason" })
  cancelReason?: string;

  @ApiPropertyOptional({ description: "Check-in timestamp" })
  checkInAt?: string;
}

export class EventAttendeeListData {
  @ApiProperty({ type: [EventAttendeeDto], description: "List of attendees" })
  items!: EventAttendeeDto[];

  @ApiProperty({ type: PageData, description: "Pagination metadata" })
  page!: PageData;
}

export class EventRegistrationDetails {
  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ description: "Total capacity" })
  totalCapacity!: number;

  @ApiProperty({ description: "Seats taken" })
  seatsTaken!: number;

  @ApiProperty({ description: "Seats remaining" })
  seatsRemaining!: number;

  @ApiProperty({ description: "Registration is open" })
  registrationOpen!: boolean;

  @ApiPropertyOptional({ description: "Registration URL" })
  registrationUrl?: string;

  @ApiProperty({ description: "User is registered" })
  userRegistered!: boolean;

  @ApiProperty({ description: "User's seat count" })
  userSeats!: number;
}

export class EventRegistrationCancelResponse {
  @ApiProperty({ description: "Event code" })
  eventCode!: string;

  @ApiProperty({ description: "Cancellation status", enum: ["cancelled"] })
  status!: "cancelled";

  @ApiPropertyOptional({ description: "Additional message" })
  message?: string;
}

// Event Email DTOs
export enum EventEmailType {
  EVENT_SUBMITTED_FOR_APPROVAL = "EVENT_SUBMITTED_FOR_APPROVAL",
  EVENT_SUBMITTED_USER = "EVENT_SUBMITTED_USER",
  EVENT_APPROVED_USER = "EVENT_APPROVED_USER",
  EVENT_REJECTED_USER = "EVENT_REJECTED_USER",
}

export class SendEventEmailRequest {
   @ApiProperty({ description: "User email address to send to" })
   @IsEmail()
   @IsNotEmpty()
   email!: string;

   @ApiProperty({
     enum: EventEmailType,
     description: "Type of email to send",
     example: EventEmailType.EVENT_APPROVED_USER
   })
   @IsEnum(EventEmailType)
   type!: EventEmailType;

   @ApiPropertyOptional({ description: "Event code" })
   @IsString()
   @IsOptional()
   eventCode?: string;

   @ApiPropertyOptional({ description: "Event title" })
   @IsString()
   @IsOptional()
   eventTitle?: string;

   @ApiProperty({ description: "Organizer name" })
   @IsString()
   @IsNotEmpty()
   organizerName!: string;

   @ApiPropertyOptional({ description: "Scheduled date" })
   @IsString()
   @IsOptional()
   scheduledDate?: string;

   @ApiPropertyOptional({ description: "Event type" })
   @IsString()
   @IsOptional()
   eventType?: string;

   @ApiPropertyOptional({ description: "Rejection reason" })
   @IsString()
   @IsOptional()
   rejectionReason?: string;

   @ApiPropertyOptional({ description: "User first name" })
   @IsString()
   @IsOptional()
   firstName?: string;

   @ApiPropertyOptional({ description: "User last name" })
   @IsString()
   @IsOptional()
   lastName?: string;
}

export class SendEventEmailResponse {
  @ApiProperty({ description: "Success message" })
  message!: string;
}

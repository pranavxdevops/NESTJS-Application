import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { EventRepository } from "./repository/event.repository";
import { RegistrationRepository } from "./repository/registration.repository";
import type { IZoomService } from "./zoom/zoom.interface";
import { ZOOM_SERVICE } from "./zoom/zoom.provider";
import { EmailService } from "@shared/email/email.service";
import { EmailTemplateCode, SupportedLanguage } from "@shared/email/schemas/email-template.schema";
import { Event } from "./schemas/event.schema";
import { Registration } from "./schemas/registration.schema";
import {
  EventCreateRequest,
  EventCreateResponse,
  EventListResponse,
  EventListItemDto,
  EventDetailsDto,
  EventUpdateRequest,
  EventCancelRequest,
  EventRegistrationRequest,
  EventRegistrationResponse,
  MyRegistrationResponse,
  EventAttendeeListData,
  EventAttendeeDto,
  EventRegistrationDetails,
  EventRegistrationCancelResponse,
  AttendeeRegistrationDto,
  EventType,
  EventStatus,
  RegistrationStatus,
  SendEventEmailRequest,
  SendEventEmailResponse,
  EventEmailType,
} from "./dto/events.dto";

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly registrationRepository: RegistrationRepository,
    @Inject(ZOOM_SERVICE) private readonly zoomService: IZoomService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Type conversion helpers
  private toSchemaEventType(dtoType: EventType): "webinar" | "event" {
    return dtoType === EventType.WEBINAR ? "webinar" : "event";
  }

  private toDtoEventType(schemaType: "webinar" | "event"): EventType {
    return schemaType === "webinar" ? EventType.WEBINAR : EventType.EVENT;
  }

  private toDtoEventStatus(
    schemaStatus: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled",
  ): EventStatus {
    const map: Record<string, EventStatus> = {
      draft: EventStatus.DRAFT,
      scheduled: EventStatus.SCHEDULED,
      ongoing: EventStatus.ONGOING,
      completed: EventStatus.COMPLETED,
      cancelled: EventStatus.CANCELLED,
    };
    return map[schemaStatus];
  }

  private toDtoRegistrationStatus(
    schemaStatus: "confirmed" | "waitlisted" | "pendingPayment" | "cancelled",
  ): RegistrationStatus {
    const map: Record<string, RegistrationStatus> = {
      confirmed: RegistrationStatus.CONFIRMED,
      waitlisted: RegistrationStatus.WAITLISTED,
      pendingPayment: RegistrationStatus.PENDING_PAYMENT,
      cancelled: RegistrationStatus.CANCELLED,
    };
    return map[schemaStatus];
  }

  /**
   * Create event - simplified for now, will be expanded
   */
  async createEvent(dto: EventCreateRequest): Promise<EventCreateResponse> {
    this.logger.log(`Creating event: ${dto.eventCode}`);

    const existing = await this.eventRepository.findByEventCode(dto.eventCode);
    if (existing) {
      throw new BadRequestException(`Event with code '${dto.eventCode}' already exists`);
    }

    const eventId = randomUUID();
    const event: Partial<Event> = {
      id: eventId,
      eventCode: dto.eventCode,
      type: this.toSchemaEventType(dto.type),
      title: dto.title,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
      timezone: dto.timezone || "UTC",
      presenter: dto.presenter,
      capacity: dto.capacity,
      language: dto.language || "en",
      status: "scheduled",
      createdBy: dto.createdBy,
      deletedAt: null,
    };

    await this.eventRepository.create(event);

    return {
      id: eventId,
      eventCode: dto.eventCode,
      status: EventStatus.SCHEDULED,
      zoom: undefined,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * List events with filtering
   */
  async listEvents(
    filters: { status?: string[]; type?: string; createdBy?: string; q?: string },
    page: number,
    pageSize: number,
  ): Promise<EventListResponse> {
    const result = await this.eventRepository.searchEvents(filters.q || "", filters, {
      page,
      pageSize,
    });

    const items: EventListItemDto[] = await Promise.all(
      result.items.map(async (event) => {
        const registrationCount = await this.registrationRepository.countByEventCodeAndStatus(
          event.eventCode,
          "confirmed",
        );

        return {
          id: event.id,
          eventCode: event.eventCode,
          title: event.title,
          scheduledAt: event.scheduledAt.toISOString(),
          type: this.toDtoEventType(event.type),
          capacity: event.capacity,
          status: this.toDtoEventStatus(event.status),
          presenter: event.presenter,
          createdBy: event.createdBy,
          registrationCount,
        };
      }),
    );

    return { items, page: result.page };
  }

  /**
   * Get event details
   */
  async getEventByCode(eventCode: string): Promise<EventDetailsDto> {
    const event = await this.eventRepository.findByEventCode(eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${eventCode}' not found`);
    }

    const registrationCount = await this.registrationRepository.countByEventCode(eventCode);
    const availableSeats = event.capacity - registrationCount;

    return {
      id: event.id,
      eventCode: event.eventCode,
      type: this.toDtoEventType(event.type),
      title: event.title,
      description: event.description,
      scheduledAt: event.scheduledAt.toISOString(),
      durationMinutes: event.durationMinutes,
      timezone: event.timezone,
      presenter: event.presenter,
      capacity: event.capacity,
      language: event.language,
      status: this.toDtoEventStatus(event.status),
      createdBy: event.createdBy,
      registrationSettings: event.registrationSettings
        ? {
            requiresApproval: event.registrationSettings.requiresApproval,
            registrationDeadline: event.registrationSettings.registrationDeadline?.toISOString(),
            allowWaitlist: event.registrationSettings.allowWaitlist,
          }
        : undefined,
      zoomDetails: event.zoomDetails,
      externalUrl: event.externalUrl,
      externalRegistrationUrl: event.externalRegistrationUrl,
      registrationCount,
      availableSeats,
      registrationOpen: availableSeats > 0 && event.status === "scheduled",
      userRegistered: false,
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Update event
   */
  async updateEvent(eventCode: string, dto: EventUpdateRequest): Promise<EventDetailsDto> {
    const event = await this.eventRepository.findByEventCode(eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${eventCode}' not found`);
    }

    const updates: any = {};
    if (dto.title) updates.title = dto.title;
    if (dto.description) updates.description = dto.description;
    if (dto.scheduledAt) updates.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes) updates.durationMinutes = dto.durationMinutes;
    if (dto.presenter) updates.presenter = dto.presenter;
    if (dto.capacity) updates.capacity = dto.capacity;

    await this.eventRepository.updateOne({ eventCode } as any, { $set: updates } as any);
    return this.getEventByCode(eventCode);
  }

  /**
   * Delete event
   */
  async deleteEvent(eventCode: string): Promise<void> {
    const event = await this.eventRepository.findByEventCode(eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${eventCode}' not found`);
    }

    const registrationCount = await this.registrationRepository.countByEventCode(eventCode);
    if (registrationCount > 0) {
      throw new BadRequestException("Cannot delete event with registrations");
    }

    await this.eventRepository.deleteOne({ eventCode } as any, true);
  }

  /**
   * Cancel event
   */
  async cancelEvent(eventCode: string, dto: EventCancelRequest): Promise<void> {
    const event = await this.eventRepository.findByEventCode(eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${eventCode}' not found`);
    }

    await this.eventRepository.updateOne(
      { eventCode } as any,
      { $set: { status: "cancelled", cancelReason: dto.reason, cancelledAt: new Date() } } as any,
    );

    const registrations = await this.registrationRepository.findByEventCode(eventCode, {
      page: 1,
      pageSize: 1000,
    });
    const ids = registrations.items.map((r) => r.id);
    if (ids.length > 0) {
      await this.registrationRepository.bulkUpdateStatus(ids, "cancelled");
    }
  }

  /**
   * Register for event - NO QUOTA CHECKING (handled by membership features)
   */
  async registerForEvent(dto: EventRegistrationRequest): Promise<EventRegistrationResponse> {
    const event = await this.eventRepository.findByEventCode(dto.eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${dto.eventCode}' not found`);
    }

    const registrationCount = await this.registrationRepository.countByEventCode(dto.eventCode);
    const availableSeats = event.capacity - registrationCount;

    if (dto.attendees.length > availableSeats) {
      throw new BadRequestException(`Only ${availableSeats} seats available`);
    }

    const registrations: AttendeeRegistrationDto[] = [];

    for (const attendee of dto.attendees) {
      const existing = await this.registrationRepository.findByEventCodeAndEmail(
        dto.eventCode,
        attendee.email,
      );
      if (existing && existing.status !== "cancelled") {
        throw new BadRequestException(`Attendee ${attendee.email} is already registered`);
      }

      const registrationId = randomUUID();
      const registration: Partial<Registration> = {
        id: registrationId,
        eventCode: dto.eventCode,
        eventId: event.id,
        membershipId: dto.membershipId,
        attendee,
        status: "confirmed",
        deletedAt: null,
      };

      await this.registrationRepository.create(registration);

      registrations.push({
        attendeeId: registrationId,
        email: attendee.email,
        status: RegistrationStatus.CONFIRMED,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        joinUrl: undefined,
        zoomRegistrantId: undefined,
      });
    }

    return {
      registrationId: registrations[0].attendeeId,
      eventCode: dto.eventCode,
      status: RegistrationStatus.CONFIRMED,
      registrations,
      message: "Registration successful",
    };
  }

  /**
   * Get user's registration
   */
  async getMyRegistration(eventCode: string, email: string): Promise<MyRegistrationResponse> {
    const registration = await this.registrationRepository.findByEventCodeAndEmail(
      eventCode,
      email,
    );

    if (!registration || registration.status === "cancelled") {
      return { registered: false };
    }

    return {
      registered: true,
      registrationId: registration.id,
      status: this.toDtoRegistrationStatus(registration.status),
      attendee: registration.attendee,
      joinUrl: registration.joinUrl,
      zoomRegistrantId: registration.zoomRegistrantId,
      registeredAt: registration.createdAt?.toISOString(),
    };
  }

  /**
   * Get registration details
   */
  async getRegistrationDetails(eventCode: string): Promise<EventRegistrationDetails> {
    const event = await this.eventRepository.findByEventCode(eventCode);
    if (!event) {
      throw new NotFoundException(`Event '${eventCode}' not found`);
    }

    const registrationCount = await this.registrationRepository.countByEventCode(eventCode);
    const seatsRemaining = event.capacity - registrationCount;

    return {
      eventCode,
      totalCapacity: event.capacity,
      seatsTaken: registrationCount,
      seatsRemaining,
      registrationOpen: seatsRemaining > 0 && event.status === "scheduled",
      registrationUrl:
        event.zoomDetails?.registrationUrl || event.externalRegistrationUrl || undefined,
      userRegistered: false,
      userSeats: 0,
    };
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(eventCode: string): Promise<EventRegistrationCancelResponse> {
    throw new BadRequestException("Not implemented");
  }

  /**
   * Get attendees
   */
  async getAttendees(
    eventCode: string,
    filters: { status?: string[]; includeCancelled?: boolean; q?: string },
    page: number,
    pageSize: number,
  ): Promise<EventAttendeeListData> {
    const result = await this.registrationRepository.searchRegistrations(
      eventCode,
      {
        status: filters.status,
        includeCancelled: filters.includeCancelled,
        searchQuery: filters.q,
      },
      { page, pageSize },
    );

    const items: EventAttendeeDto[] = result.items.map((reg) => ({
      registrationId: reg.id,
      eventCode: reg.eventCode,
      attendee: reg.attendee,
      membershipId: reg.membershipId,
      status: this.toDtoRegistrationStatus(reg.status),
      registeredAt: reg.createdAt?.toISOString() || new Date().toISOString(),
      cancelledAt: reg.cancelledAt?.toISOString(),
      cancelReason: reg.cancelReason,
      checkInAt: reg.checkInAt?.toISOString(),
    }));

    return { items, page: result.page };
  }

  /**
   * Export attendees to XLSX
   */
  async exportAttendeesXlsx(eventCode: string): Promise<Buffer> {
    const result = await this.registrationRepository.searchRegistrations(
      eventCode,
      {},
      { page: 1, pageSize: 10000 },
    );

    const header = "Event Code,First Name,Last Name,Email,Status\n";
    const rows = result.items
      .map(
        (reg) =>
          `${eventCode},${reg.attendee.firstName},${reg.attendee.lastName},${reg.attendee.email},${reg.status}`,
      )
      .join("\n");

    return Buffer.from(header + rows);
  }

  /**
   * Send event notification email
   */
  async sendEventEmail(dto: SendEventEmailRequest): Promise<SendEventEmailResponse> {
    // Map the email type to template code
    const templateCodeMap: Record<EventEmailType, EmailTemplateCode> = {
      [EventEmailType.EVENT_SUBMITTED_FOR_APPROVAL]: EmailTemplateCode.EVENT_SUBMITTED_FOR_APPROVAL,
      [EventEmailType.EVENT_SUBMITTED_USER]: EmailTemplateCode.EVENT_SUBMITTED_USER,
      [EventEmailType.EVENT_APPROVED_USER]: EmailTemplateCode.EVENT_APPROVED_USER,
      [EventEmailType.EVENT_REJECTED_USER]: EmailTemplateCode.EVENT_REJECTED_USER,
    };

    // Special handling for EVENT_SUBMITTED_FOR_APPROVAL - send to both admin and user
    if (dto.type === EventEmailType.EVENT_SUBMITTED_FOR_APPROVAL) {
      await this.sendEventSubmittedEmails(dto);
      return { message: "Emails sent successfully" };
    }

    const templateCode = templateCodeMap[dto.type];
    if (!templateCode) {
      throw new BadRequestException(`Invalid email type: ${dto.type}`);
    }

    const recipientEmail = dto.email;
    this.logger.log(`Sending event email of type ${dto.type} to ${recipientEmail}`);

    // Build email parameters
    const emailParams: Record<string, any> = {};

    if (dto.eventCode) emailParams.eventCode = dto.eventCode;
    if (dto.eventTitle) emailParams.eventTitle = dto.eventTitle;
    if (dto.organizerName) emailParams.organizerName = dto.organizerName;
    if (dto.scheduledDate) emailParams.scheduledDate = dto.scheduledDate;
    if (dto.eventType) emailParams.eventType = dto.eventType;
    if (dto.rejectionReason) emailParams.rejectionReason = dto.rejectionReason;
    if (dto.firstName) emailParams.firstName = dto.firstName;
    if (dto.lastName) emailParams.lastName = dto.lastName;

    try {
      await this.emailService.sendTemplatedEmail({
        templateCode: templateCode as never,
        language: SupportedLanguage.ENGLISH,
        to: recipientEmail,
        params: emailParams,
      });

      this.logger.log(`Event email sent successfully to ${recipientEmail}`);
      return { message: "Email sent successfully" };
    } catch (error) {
      this.logger.error(`Failed to send event email to ${recipientEmail}:`, error);
      throw new BadRequestException(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Send both admin and user emails when event is submitted for approval
   */
  private async sendEventSubmittedEmails(dto: SendEventEmailRequest): Promise<void> {
    const adminEmail = this.configService.get<string>('WFZO_ADMIN_EMAIL');
    if (!adminEmail) {
      throw new BadRequestException('Admin email not configured');
    }

    // Build common email parameters
    const emailParams: Record<string, any> = {};
    if (dto.eventTitle) emailParams.eventTitle = dto.eventTitle;
    if (dto.organizerName) emailParams.organizerName = dto.organizerName;
    if (dto.scheduledDate) emailParams.scheduledDate = dto.scheduledDate;
    if (dto.eventType) emailParams.eventType = dto.eventType;

    // Send email to admin
    try {
      await this.emailService.sendTemplatedEmail({
        templateCode: EmailTemplateCode.EVENT_SUBMITTED_FOR_APPROVAL,
        language: SupportedLanguage.ENGLISH,
        to: adminEmail,
        params: emailParams,
      });
      this.logger.log(`Admin notification email sent successfully to ${adminEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send admin email to ${adminEmail}:`, error);
      throw new BadRequestException(`Failed to send admin email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Send email to user
    const userParams = { ...emailParams };
    if (dto.firstName) userParams.firstName = dto.firstName;
    if (dto.lastName) userParams.lastName = dto.lastName;

    try {
      await this.emailService.sendTemplatedEmail({
        templateCode: EmailTemplateCode.EVENT_SUBMITTED_USER,
        language: SupportedLanguage.ENGLISH,
        to: dto.email,
        params: userParams,
      });
      this.logger.log(`User notification email sent successfully to ${dto.email}`);
    } catch (error) {
      this.logger.error(`Failed to send user email to ${dto.email}:`, error);
      throw new BadRequestException(`Failed to send user email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

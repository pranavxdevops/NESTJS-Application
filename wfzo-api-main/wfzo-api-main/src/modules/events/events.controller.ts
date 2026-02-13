import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from "@nestjs/swagger";
import type { Response } from "express";
import { EventsService } from "./events.service";
import {
  EventCreateRequest,
  EventCreateResponse,
  EventListResponse,
  EventDetailsDto,
  EventUpdateRequest,
  EventCancelRequest,
  EventRegistrationRequest,
  EventRegistrationResponse,
  MyRegistrationResponse,
  EventRegistrationDetails,
  EventRegistrationCancelResponse,
  EventAttendeeListData,
  SendEventEmailRequest,
  SendEventEmailResponse,
} from "./dto/events.dto";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "Create a new event",
    description: "Create a new online event with optional Zoom integration",
  })
  @ApiBody({ type: EventCreateRequest })
  @ApiResponse({
    status: 201,
    description: "Event created successfully",
    type: EventCreateResponse,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createEvent(@Body() dto: EventCreateRequest): Promise<EventCreateResponse> {
    return this.eventsService.createEvent(dto);
  }

  @Get()
  @ApiOperation({
    summary: "List all events",
    description: "Get a paginated list of events with optional filtering",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status (draft, scheduled, ongoing, completed, cancelled)",
  })
  @ApiQuery({ name: "type", required: false, description: "Filter by type (webinar, meeting)" })
  @ApiQuery({ name: "createdBy", required: false, description: "Filter by creator memberId" })
  @ApiQuery({ name: "q", required: false, description: "Search query for title/description" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "pageSize", required: false, type: Number, description: "Items per page" })
  @ApiResponse({
    status: 200,
    description: "Events list retrieved successfully",
    type: EventListResponse,
  })
  async listEvents(
    @Query("status") status?: string[],
    @Query("type") type?: string,
    @Query("createdBy") createdBy?: string,
    @Query("q") q?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number = 20,
  ): Promise<EventListResponse> {
    return this.eventsService.listEvents({ status, type, createdBy, q }, page, pageSize);
  }

  @Get(":eventCode")
  @ApiOperation({
    summary: "Get event details",
    description: "Get detailed information about a specific event",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiResponse({
    status: 200,
    description: "Event details retrieved successfully",
    type: EventDetailsDto,
  })
  @ApiResponse({ status: 404, description: "Event not found" })
  async getEventByCode(@Param("eventCode") eventCode: string): Promise<EventDetailsDto> {
    return this.eventsService.getEventByCode(eventCode);
  }

  @Patch(":eventCode")
  @ApiOperation({
    summary: "Update event",
    description: "Update event details",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiBody({ type: EventUpdateRequest })
  @ApiResponse({ status: 200, description: "Event updated successfully", type: EventDetailsDto })
  @ApiResponse({ status: 404, description: "Event not found" })
  async updateEvent(
    @Param("eventCode") eventCode: string,
    @Body() dto: EventUpdateRequest,
  ): Promise<EventDetailsDto> {
    return this.eventsService.updateEvent(eventCode, dto);
  }

  @Delete(":eventCode")
  @HttpCode(204)
  @ApiOperation({
    summary: "Delete event",
    description: "Delete an event (only if no registrations exist)",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiResponse({ status: 204, description: "Event deleted successfully" })
  @ApiResponse({ status: 400, description: "Cannot delete event with registrations" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async deleteEvent(@Param("eventCode") eventCode: string): Promise<void> {
    return this.eventsService.deleteEvent(eventCode);
  }

  @Post(":eventCode/cancel")
  @HttpCode(200)
  @ApiOperation({
    summary: "Cancel event",
    description: "Cancel an event and all its registrations",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiBody({ type: EventCancelRequest })
  @ApiResponse({ status: 200, description: "Event cancelled successfully" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async cancelEvent(
    @Param("eventCode") eventCode: string,
    @Body() dto: EventCancelRequest,
  ): Promise<void> {
    return this.eventsService.cancelEvent(eventCode, dto);
  }

  @Get(":eventCode/registration/me")
  @ApiOperation({
    summary: "Get my registration",
    description: "Get current user's registration status for an event",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiQuery({ name: "email", required: true, description: "User email address" })
  @ApiResponse({
    status: 200,
    description: "Registration status retrieved",
    type: MyRegistrationResponse,
  })
  async getMyRegistration(
    @Param("eventCode") eventCode: string,
    @Query("email") email: string,
  ): Promise<MyRegistrationResponse> {
    return this.eventsService.getMyRegistration(eventCode, email);
  }

  @Post("registration")
  @HttpCode(201)
  @ApiOperation({
    summary: "Register for event",
    description:
      "Register one or more attendees for an event. Quota checking is handled by membership features.",
  })
  @ApiBody({ type: EventRegistrationRequest })
  @ApiResponse({
    status: 201,
    description: "Registration successful",
    type: EventRegistrationResponse,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error or capacity exceeded" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async register(@Body() dto: EventRegistrationRequest): Promise<EventRegistrationResponse> {
    return this.eventsService.registerForEvent(dto);
  }

  @Get("registration/details/:eventCode")
  @ApiOperation({
    summary: "Get registration details",
    description: "Get registration availability and details for an event",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiResponse({
    status: 200,
    description: "Registration details retrieved",
    type: EventRegistrationDetails,
  })
  @ApiResponse({ status: 404, description: "Event not found" })
  async details(@Param("eventCode") eventCode: string): Promise<EventRegistrationDetails> {
    return this.eventsService.getRegistrationDetails(eventCode);
  }

  @Post("registration/:eventCode/cancel")
  @HttpCode(200)
  @ApiOperation({
    summary: "Cancel registration",
    description: "Cancel user's registration for an event",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiResponse({
    status: 200,
    description: "Registration cancelled",
    type: EventRegistrationCancelResponse,
  })
  @ApiResponse({ status: 404, description: "Event or registration not found" })
  async cancel(@Param("eventCode") eventCode: string): Promise<EventRegistrationCancelResponse> {
    return this.eventsService.cancelRegistration(eventCode);
  }

  @Get("registration/:eventCode/attendees")
  @ApiOperation({
    summary: "Get event attendees",
    description: "Get a list of all attendees for an event with filtering",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "pageSize", required: false, type: Number, description: "Items per page" })
  @ApiQuery({ name: "status", required: false, description: "Filter by registration status" })
  @ApiQuery({ name: "q", required: false, description: "Search query for attendee name/email" })
  @ApiQuery({
    name: "includeCancelled",
    required: false,
    type: Boolean,
    description: "Include cancelled registrations",
  })
  @ApiResponse({
    status: 200,
    description: "Attendees list retrieved",
    type: EventAttendeeListData,
  })
  async attendees(
    @Param("eventCode") eventCode: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("status") status?: string[] | string,
    @Query("q") q?: string,
    @Query("includeCancelled", new DefaultValuePipe(false), ParseBoolPipe)
    includeCancelled?: boolean,
  ): Promise<EventAttendeeListData> {
    const statusArray = Array.isArray(status)
      ? status
      : typeof status === "string" && status.length
        ? status.split(",")
        : undefined;
    return this.eventsService.getAttendees(
      eventCode,
      { status: statusArray, includeCancelled, q },
      page,
      pageSize,
    );
  }

  @Get("registration/:eventCode/attendees/export")
  @ApiOperation({
    summary: "Export attendees",
    description: "Export event attendees list to Excel format",
  })
  @ApiParam({ name: "eventCode", description: "Unique event code" })
  @ApiQuery({ name: "status", required: false, description: "Filter by registration status" })
  @ApiQuery({ name: "q", required: false, description: "Search query for attendee name/email" })
  @ApiQuery({
    name: "includeCancelled",
    required: false,
    type: Boolean,
    description: "Include cancelled registrations",
  })
  @ApiResponse({ status: 200, description: "Excel file generated successfully" })
  exportAttendees(
    @Param("eventCode") eventCode: string,
    @Query("status") status?: string[] | string,
    @Query("q") q?: string,
    @Query("includeCancelled", new DefaultValuePipe(false), ParseBoolPipe)
    includeCancelled?: boolean,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const buf = this.eventsService.exportAttendeesXlsx(eventCode);

    if (res) {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${eventCode}-attendees.xlsx"`);
    }
    return buf;
  }

  @Post("send-email")
  @HttpCode(200)
  @ApiOperation({
    summary: "Send event notification email",
    description: "Send a templated email for event notifications (approval, rejection, etc.)",
  })
  @ApiBody({ type: SendEventEmailRequest })
  @ApiResponse({
    status: 200,
    description: "Email sent successfully",
    type: SendEventEmailResponse,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  async sendEventEmail(@Body() dto: SendEventEmailRequest): Promise<SendEventEmailResponse> {
    return this.eventsService.sendEventEmail(dto);
  }
}

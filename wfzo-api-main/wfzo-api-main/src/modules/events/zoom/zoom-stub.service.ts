import { Injectable, Logger } from "@nestjs/common";
import {
  IZoomService,
  ZoomMeetingRequest,
  ZoomMeetingResponse,
  ZoomRegistrantRequest,
  ZoomRegistrantResponse,
  ZoomWebinarRequest,
  ZoomWebinarResponse,
} from "./zoom.interface";

/**
 * Zoom Stub Service - Mock implementation for development/testing
 *
 * This service provides mock responses for all Zoom API operations.
 * Use this implementation when:
 * - ZOOM_INTEGRATION_MODE=stub (or not set)
 * - Developing/testing without real Zoom credentials
 * - Running E2E tests
 *
 * All methods return realistic mock data that mimics actual Zoom API responses.
 */
@Injectable()
export class ZoomStubService implements IZoomService {
  private readonly logger = new Logger(ZoomStubService.name);

  constructor() {
    this.logger.log("🔧 Zoom Stub Service initialized - Using mock responses");
  }

  async createWebinar(request: ZoomWebinarRequest): Promise<ZoomWebinarResponse> {
    this.logger.log(`[STUB] Creating webinar: ${request.topic}`);

    return {
      id: Math.floor(Math.random() * 1000000000),
      uuid: `stub-uuid-${Date.now()}`,
      host_id: "stub-host-id",
      topic: request.topic,
      type: request.type,
      start_time: request.start_time,
      duration: request.duration,
      timezone: request.timezone || "UTC",
      created_at: new Date().toISOString(),
      join_url: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`,
      registration_url: `https://zoom.us/webinar/register/WN_stub${Date.now()}`,
      start_url: `https://zoom.us/s/${Math.floor(Math.random() * 1000000000)}?zak=stub`,
    };
  }

  async createMeeting(request: ZoomMeetingRequest): Promise<ZoomMeetingResponse> {
    this.logger.log(`[STUB] Creating meeting: ${request.topic}`);

    return {
      id: Math.floor(Math.random() * 1000000000),
      uuid: `stub-uuid-${Date.now()}`,
      host_id: "stub-host-id",
      topic: request.topic,
      type: request.type || 2,
      start_time: request.start_time || new Date().toISOString(),
      duration: request.duration || 60,
      timezone: request.timezone || "UTC",
      created_at: new Date().toISOString(),
      join_url: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`,
      start_url: `https://zoom.us/s/${Math.floor(Math.random() * 1000000000)}?zak=stub`,
      password: request.settings?.approval_type === 0 ? undefined : "stub123",
    };
  }

  async addWebinarRegistrant(
    webinarId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse> {
    this.logger.log(`[STUB] Adding registrant ${registrant.email} to webinar ${webinarId}`);

    return {
      id: `stub-id-${Date.now()}-${Math.random()}`,
      registrant_id: `stub-registrant-${Date.now()}`,
      email: registrant.email,
      first_name: registrant.first_name,
      last_name: registrant.last_name,
      join_url: `https://zoom.us/w/${webinarId}?tk=stub-token-${Date.now()}`,
      status: "approved",
    };
  }

  async addMeetingRegistrant(
    meetingId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse> {
    this.logger.log(`[STUB] Adding registrant ${registrant.email} to meeting ${meetingId}`);

    return {
      id: `stub-id-${Date.now()}-${Math.random()}`,
      registrant_id: `stub-registrant-${Date.now()}`,
      email: registrant.email,
      first_name: registrant.first_name,
      last_name: registrant.last_name,
      join_url: `https://zoom.us/j/${meetingId}?tk=stub-token-${Date.now()}`,
      status: "approved",
    };
  }

  async updateWebinar(webinarId: string, updates: Partial<ZoomWebinarRequest>): Promise<void> {
    this.logger.log(`[STUB] Updating webinar ${webinarId}`, updates);
    // No-op for stub
  }

  async updateMeeting(meetingId: string, updates: Partial<ZoomMeetingRequest>): Promise<void> {
    this.logger.log(`[STUB] Updating meeting ${meetingId}`, updates);
    // No-op for stub
  }

  async cancelWebinar(webinarId: string): Promise<void> {
    this.logger.log(`[STUB] Cancelling webinar ${webinarId}`);
    // No-op for stub
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    this.logger.log(`[STUB] Cancelling meeting ${meetingId}`);
    // No-op for stub
  }

  async deleteWebinar(webinarId: string): Promise<void> {
    this.logger.log(`[STUB] Deleting webinar ${webinarId}`);
    // No-op for stub
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    this.logger.log(`[STUB] Deleting meeting ${meetingId}`);
    // No-op for stub
  }
}

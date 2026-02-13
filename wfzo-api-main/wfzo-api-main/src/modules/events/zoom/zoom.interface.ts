/**
 * Zoom API Integration Interfaces
 *
 * These interfaces define the contract for Zoom service implementations.
 * Both stub and real implementations must conform to these interfaces.
 */

export interface ZoomWebinarRequest {
  topic: string;
  type: 5 | 6 | 9; // 5=webinar, 6=recurring webinar, 9=recurring webinar with fixed time
  start_time: string;
  duration: number;
  timezone?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    panelists_video?: boolean;
    practice_session?: boolean;
    hd_video?: boolean;
    approval_type?: 0 | 1 | 2; // 0=auto, 1=manual, 2=no registration
    registration_type?: 1 | 2 | 3; // 1=attendees register once, 2=attendees need to register for each occurrence, 3=attendees register once and can attend any occurrence
    audio?: "both" | "telephony" | "voip";
    auto_recording?: "none" | "local" | "cloud";
    waiting_room?: boolean;
  };
}

export interface ZoomMeetingRequest {
  topic: string;
  type: 1 | 2 | 3 | 8; // 1=instant, 2=scheduled, 3=recurring no fixed time, 8=recurring fixed time
  start_time?: string;
  duration?: number;
  timezone?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: 0 | 1 | 2;
    audio?: "both" | "telephony" | "voip";
    auto_recording?: "none" | "local" | "cloud";
    waiting_room?: boolean;
  };
}

export interface ZoomRegistrantRequest {
  email: string;
  first_name: string;
  last_name: string;
  org?: string;
  job_title?: string;
  phone?: string;
}

export interface ZoomWebinarResponse {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  registration_url?: string;
  start_url: string;
}

export interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  start_url: string;
  password?: string;
}

export interface ZoomRegistrantResponse {
  id: string;
  registrant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  join_url: string;
  status: string;
}

/**
 * Abstract interface for Zoom service implementations
 *
 * This interface must be implemented by both:
 * - ZoomStubService (mock responses for testing/development)
 * - ZoomRealService (actual Zoom API integration for production)
 */
export interface IZoomService {
  /**
   * Create a new Zoom webinar
   */
  createWebinar(request: ZoomWebinarRequest): Promise<ZoomWebinarResponse>;

  /**
   * Create a new Zoom meeting
   */
  createMeeting(request: ZoomMeetingRequest): Promise<ZoomMeetingResponse>;

  /**
   * Add a registrant to a webinar
   */
  addWebinarRegistrant(
    webinarId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse>;

  /**
   * Add a registrant to a meeting (if registration is required)
   */
  addMeetingRegistrant(
    meetingId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse>;

  /**
   * Update a webinar
   */
  updateWebinar(webinarId: string, updates: Partial<ZoomWebinarRequest>): Promise<void>;

  /**
   * Update a meeting
   */
  updateMeeting(meetingId: string, updates: Partial<ZoomMeetingRequest>): Promise<void>;

  /**
   * Cancel a webinar
   */
  cancelWebinar(webinarId: string): Promise<void>;

  /**
   * Cancel a meeting
   */
  cancelMeeting(meetingId: string): Promise<void>;

  /**
   * Delete a webinar
   */
  deleteWebinar(webinarId: string): Promise<void>;

  /**
   * Delete a meeting
   */
  deleteMeeting(meetingId: string): Promise<void>;
}

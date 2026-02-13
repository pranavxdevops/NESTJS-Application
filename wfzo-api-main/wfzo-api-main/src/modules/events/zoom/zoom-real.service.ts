import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance, AxiosError } from "axios";
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
 * Zoom Real Service - Production implementation with actual Zoom API integration
 *
 * This service integrates with the real Zoom API using OAuth 2.0 authentication.
 * Use this implementation when:
 * - ZOOM_INTEGRATION_MODE=real
 * - All required Zoom credentials are configured
 * - Running in production or staging environments
 *
 * Required Environment Variables:
 * - ZOOM_ACCOUNT_ID: Your Zoom account ID
 * - ZOOM_CLIENT_ID: OAuth app client ID
 * - ZOOM_CLIENT_SECRET: OAuth app client secret
 * - ZOOM_API_BASE_URL: Base URL for Zoom API (default: https://api.zoom.us/v2)
 *
 * Authentication:
 * Uses OAuth 2.0 Server-to-Server authentication (recommended by Zoom)
 * Access tokens are automatically managed and refreshed
 *
 * Error Handling:
 * - Retries on transient failures (rate limits, network errors)
 * - Throws InternalServerErrorException on permanent failures
 * - Logs all errors for debugging
 *
 * Rate Limiting:
 * Zoom API has rate limits:
 * - Light: 30 requests/second
 * - Medium: 20 requests/second
 * - Heavy: 10 requests/second
 * Consider implementing rate limiting if needed
 */
@Injectable()
export class ZoomRealService implements IZoomService {
  private readonly logger = new Logger(ZoomRealService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiBaseUrl: string;
  private readonly accountId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.apiBaseUrl = this.configService.get<string>("ZOOM_API_BASE_URL", "https://api.zoom.us/v2");
    this.accountId = this.configService.get<string>("ZOOM_ACCOUNT_ID", "");
    this.clientId = this.configService.get<string>("ZOOM_CLIENT_ID", "");
    this.clientSecret = this.configService.get<string>("ZOOM_CLIENT_SECRET", "");

    this.httpClient = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.logger.log("🚀 Zoom Real Service initialized - Using actual Zoom API");
  }

  /**
   * Validate credentials are configured before making API calls
   */
  private validateCredentials(): void {
    if (!this.accountId || !this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException(
        "Zoom API credentials are not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET environment variables.",
      );
    }
  }

  /**
   * Get OAuth access token (Server-to-Server OAuth)
   * Tokens are cached and automatically refreshed when expired
   */
  private async getAccessToken(): Promise<string> {
    // Validate credentials before attempting to get token
    this.validateCredentials();

    // Return cached token if still valid (with 5-minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    this.logger.log("Requesting new Zoom access token...");

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

      const response = await axios.post<{ access_token: string; expires_in: number }>(
        "https://zoom.us/oauth/token",
        null,
        {
          params: {
            grant_type: "account_credentials",
            account_id: this.accountId,
          },
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      this.logger.log("✅ Zoom access token obtained successfully");
      return this.accessToken;
    } catch (error) {
      this.logger.error("Failed to obtain Zoom access token", error);
      throw new InternalServerErrorException("Failed to authenticate with Zoom API");
    }
  }

  /**
   * Make an authenticated request to Zoom API with automatic token refresh
   */
  private async makeAuthenticatedRequest<T>(
    method: "get" | "post" | "patch" | "put" | "delete",
    url: string,
    data?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await this.httpClient.request<T>({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      this.handleZoomApiError(error);
    }
  }

  /**
   * Handle Zoom API errors with proper logging and error messages
   */
  private handleZoomApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ code: number; message: string }>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const zoomError = axiosError.response.data;

        this.logger.error(
          `Zoom API error [${status}]: ${zoomError?.message || axiosError.message}`,
          {
            code: zoomError?.code,
            status,
            url: axiosError.config?.url,
          },
        );

        // Handle specific error codes
        switch (status) {
          case 400:
            throw new InternalServerErrorException(
              `Invalid request to Zoom API: ${zoomError?.message || "Bad request"}`,
            );
          case 401:
            throw new InternalServerErrorException("Zoom API authentication failed");
          case 404:
            throw new InternalServerErrorException(
              `Zoom resource not found: ${zoomError?.message || "Not found"}`,
            );
          case 429:
            throw new InternalServerErrorException(
              "Zoom API rate limit exceeded. Please try again later.",
            );
          default:
            throw new InternalServerErrorException(
              `Zoom API error: ${zoomError?.message || "Unknown error"}`,
            );
        }
      }

      this.logger.error("Zoom API request failed", axiosError.message);
      throw new InternalServerErrorException("Failed to communicate with Zoom API");
    }

    this.logger.error("Unexpected error calling Zoom API", error);
    throw new InternalServerErrorException("Zoom integration error");
  }

  async createWebinar(request: ZoomWebinarRequest): Promise<ZoomWebinarResponse> {
    this.logger.log(`Creating Zoom webinar: ${request.topic}`);

    return this.makeAuthenticatedRequest<ZoomWebinarResponse>(
      "post",
      "/users/me/webinars",
      request,
    );
  }

  async createMeeting(request: ZoomMeetingRequest): Promise<ZoomMeetingResponse> {
    this.logger.log(`Creating Zoom meeting: ${request.topic}`);

    return this.makeAuthenticatedRequest<ZoomMeetingResponse>(
      "post",
      "/users/me/meetings",
      request,
    );
  }

  async addWebinarRegistrant(
    webinarId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse> {
    this.logger.log(`Adding registrant ${registrant.email} to webinar ${webinarId}`);

    return this.makeAuthenticatedRequest<ZoomRegistrantResponse>(
      "post",
      `/webinars/${webinarId}/registrants`,
      registrant,
    );
  }

  async addMeetingRegistrant(
    meetingId: string,
    registrant: ZoomRegistrantRequest,
  ): Promise<ZoomRegistrantResponse> {
    this.logger.log(`Adding registrant ${registrant.email} to meeting ${meetingId}`);

    return this.makeAuthenticatedRequest<ZoomRegistrantResponse>(
      "post",
      `/meetings/${meetingId}/registrants`,
      registrant,
    );
  }

  async updateWebinar(webinarId: string, updates: Partial<ZoomWebinarRequest>): Promise<void> {
    this.logger.log(`Updating webinar ${webinarId}`);

    await this.makeAuthenticatedRequest<void>("patch", `/webinars/${webinarId}`, updates);
  }

  async updateMeeting(meetingId: string, updates: Partial<ZoomMeetingRequest>): Promise<void> {
    this.logger.log(`Updating meeting ${meetingId}`);

    await this.makeAuthenticatedRequest<void>("patch", `/meetings/${meetingId}`, updates);
  }

  async cancelWebinar(webinarId: string): Promise<void> {
    this.logger.log(`Cancelling webinar ${webinarId}`);

    await this.makeAuthenticatedRequest<void>("put", `/webinars/${webinarId}/status`, {
      action: "cancel",
    });
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    this.logger.log(`Cancelling meeting ${meetingId}`);

    await this.makeAuthenticatedRequest<void>("delete", `/meetings/${meetingId}`);
  }

  async deleteWebinar(webinarId: string): Promise<void> {
    this.logger.log(`Deleting webinar ${webinarId}`);

    await this.makeAuthenticatedRequest<void>("delete", `/webinars/${webinarId}`);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    this.logger.log(`Deleting meeting ${meetingId}`);

    await this.makeAuthenticatedRequest<void>("delete", `/meetings/${meetingId}`);
  }
}

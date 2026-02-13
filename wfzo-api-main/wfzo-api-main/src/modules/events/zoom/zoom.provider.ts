import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ZoomStubService } from "./zoom-stub.service";
import { ZoomRealService } from "./zoom-real.service";
import { IZoomService } from "./zoom.interface";

/**
 * Zoom Service Token
 * Use this token to inject the appropriate Zoom service implementation
 *
 * @example
 * constructor(@Inject(ZOOM_SERVICE) private readonly zoomService: IZoomService) {}
 */
export const ZOOM_SERVICE = Symbol("ZOOM_SERVICE");

/**
 * Zoom Service Provider Factory
 *
 * Creates the appropriate Zoom service implementation based on configuration.
 *
 * Configuration:
 * - ZOOM_INTEGRATION_MODE=stub (default): Uses ZoomStubService with mock responses
 * - ZOOM_INTEGRATION_MODE=real: Uses ZoomRealService with actual Zoom API
 *
 * When using real mode, ensure these environment variables are set:
 * - ZOOM_ACCOUNT_ID
 * - ZOOM_CLIENT_ID
 * - ZOOM_CLIENT_SECRET
 * - ZOOM_API_BASE_URL (optional, defaults to https://api.zoom.us/v2)
 *
 * Usage in module:
 * @Module({
 *   providers: [ZoomServiceProvider, ZoomStubService, ZoomRealService],
 *   exports: [ZOOM_SERVICE],
 * })
 */
export const ZoomServiceProvider: Provider<IZoomService> = {
  provide: ZOOM_SERVICE,
  useFactory: (
    configService: ConfigService,
    stubService: ZoomStubService,
    realService: ZoomRealService,
  ): IZoomService => {
    const mode = configService.get<string>("ZOOM_INTEGRATION_MODE", "stub").toLowerCase();

    if (mode === "real") {
      // Validate required credentials are present
      const accountId = configService.get<string>("ZOOM_ACCOUNT_ID");
      const clientId = configService.get<string>("ZOOM_CLIENT_ID");
      const clientSecret = configService.get<string>("ZOOM_CLIENT_SECRET");

      if (!accountId || !clientId || !clientSecret) {
        throw new Error(
          "Zoom real integration mode requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET",
        );
      }

      return realService;
    }

    // Default to stub mode
    return stubService;
  },
  inject: [ConfigService, ZoomStubService, ZoomRealService],
};

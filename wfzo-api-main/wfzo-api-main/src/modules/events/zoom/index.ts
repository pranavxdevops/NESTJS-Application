/**
 * Zoom Integration Module
 *
 * Provides modular Zoom API integration with switchable implementations:
 * - Stub mode: Mock responses for development/testing
 * - Real mode: Actual Zoom API integration for production
 *
 * Configure via ZOOM_INTEGRATION_MODE environment variable
 */

export * from "./zoom.interface";
export * from "./zoom-stub.service";
export * from "./zoom-real.service";
export * from "./zoom.provider";

// Minimal ambient type declarations for 'leaflet-geosearch'.
// This library does not ship its own TypeScript types. We only use the OpenStreetMapProvider
// for forward geocoding (address -> coordinates). If more providers / methods are needed,
// extend this file accordingly.
// NOTE: These are intentionally lightweight; they model only what the app currently uses.

declare module 'leaflet-geosearch' {
  export interface SearchResult {
    x: number; // longitude
    y: number; // latitude
    label?: string;
    bounds?: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  raw?: unknown; // original provider payload (provider-specific structure)
  }

  export interface OpenStreetMapProviderOptions {
    params?: Record<string, string | number | boolean | undefined>;
  }

  export class OpenStreetMapProvider {
    constructor(options?: OpenStreetMapProviderOptions);
    search(request: { query: string }): Promise<SearchResult[]>;
  }
}

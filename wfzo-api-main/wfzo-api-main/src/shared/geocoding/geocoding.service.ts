import { Injectable, Logger } from "@nestjs/common";
import NodeGeocoder, { Options, Entry } from "node-geocoder";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  country?: string;
  city?: string;
  zipcode?: string;
}

export interface AddressInput {
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

/**
 * Geocoding service to convert addresses to coordinates (latitude/longitude)
 * Uses OpenStreetMap's Nominatim (free, no API key required)
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private geocoder: NodeGeocoder.Geocoder;

  constructor() {
    // Using OpenStreetMap's Nominatim - free and no API key required
    const options: Options = {
      provider: "openstreetmap",
      // Optional: Add email for better rate limiting (recommended by Nominatim)
      formatter: null,
    };

    this.geocoder = NodeGeocoder(options);
  }

  /**
   * Get coordinates from address components
   * @param input Address components
   * @returns Coordinates and formatted address
   */
  async getCoordinates(input: AddressInput): Promise<GeocodingResult | null> {
    try {
      // Build address string from components
      const addressParts: string[] = [];

      if (input.address) addressParts.push(input.address);
      if (input.city) addressParts.push(input.city);
      if (input.state) addressParts.push(input.state);
      if (input.zipcode) addressParts.push(input.zipcode);
      if (input.country) addressParts.push(input.country);

      const fullAddress = addressParts.join(", ");

      if (!fullAddress.trim()) {
        this.logger.warn("No address components provided for geocoding");
        return null;
      }

      this.logger.debug(`Geocoding address: ${fullAddress}`);

      // Perform geocoding
      const results: Entry[] = await this.geocoder.geocode(fullAddress);

      if (!results || results.length === 0) {
        this.logger.warn(`No geocoding results found for address: ${fullAddress}`);
        return null;
      }

      // Use the first (most relevant) result
      const result = results[0];

      if (result.latitude === undefined || result.longitude === undefined) {
        this.logger.warn(`Invalid coordinates in geocoding result for: ${fullAddress}`);
        return null;
      }

      const geocodingResult: GeocodingResult = {
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
        country: result.country,
        city: result.city,
        zipcode: result.zipcode,
      };

      this.logger.debug(
        `Geocoding successful: ${fullAddress} -> (${result.latitude}, ${result.longitude})`,
      );

      return geocodingResult;
    } catch (error) {
      this.logger.error(
        `Geocoding error for address ${JSON.stringify(input)}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get coordinates from city and country
   * @param city City name
   * @param country Country name
   * @returns Coordinates and formatted address
   */
  async getCoordinatesByCity(city: string, country: string): Promise<GeocodingResult | null> {
    return this.getCoordinates({ city, country });
  }

  /**
   * Get coordinates from zipcode and country
   * @param zipcode Postal/ZIP code
   * @param country Country name
   * @returns Coordinates and formatted address
   */
  async getCoordinatesByZipcode(zipcode: string, country: string): Promise<GeocodingResult | null> {
    return this.getCoordinates({ zipcode, country });
  }

  /**
   * Get coordinates from full address string
   * @param address Full address string
   * @returns Coordinates and formatted address
   */
  async getCoordinatesByAddress(address: string): Promise<GeocodingResult | null> {
    return this.getCoordinates({ address });
  }

  /**
   * Batch geocoding with delay to respect rate limits
   * OpenStreetMap Nominatim: Max 1 request per second
   * @param addresses Array of address inputs
   * @param delayMs Delay between requests in milliseconds (default: 1000ms)
   * @returns Array of geocoding results
   */
  async batchGeocode(
    addresses: AddressInput[],
    delayMs: number = 1000,
  ): Promise<(GeocodingResult | null)[]> {
    const results: (GeocodingResult | null)[] = [];

    for (let i = 0; i < addresses.length; i++) {
      const result = await this.getCoordinates(addresses[i]);
      results.push(result);

      // Add delay between requests to respect rate limits (except for last item)
      if (i < addresses.length - 1) {
        await this.delay(delayMs);
      }
    }

    return results;
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

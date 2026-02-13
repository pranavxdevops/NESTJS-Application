import * as XLSX from "xlsx";
import { Connection, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { GeocodingService } from "../../src/shared/geocoding/geocoding.service";

/**
 * Base Migration Class
 * Provides common services and utilities for all migration templates
 */
export abstract class BaseMigration<TExcelRow = any> {
  protected connection!: Connection;
  protected geocodingService!: GeocodingService;
  protected orgTypeMap: Map<string, string> = new Map();
  protected industryMap: Map<string, string> = new Map();
  protected globalEmailTracker: Set<string> = new Set();

  // Statistics
  protected stats = {
    membersCreated: 0,
    usersCreated: 0,
    membersSkipped: 0,
    geocodingSuccess: 0,
    geocodingFailed: 0,
    errors: 0,
  };

  constructor(protected excelFilePath: string) {}

  /**
   * Initialize migration services
   */
  async initialize(connection: Connection): Promise<void> {
    this.connection = connection;
    this.geocodingService = new GeocodingService();

    console.log("\n🔧 Initializing migration services...");
    await this.loadOrganizationTypes();
    await this.loadIndustries();
    console.log("🌍 Geocoding service initialized");
  }

  /**
   * Load organization types from dropdown values
   */
  protected async loadOrganizationTypes(): Promise<void> {
    try {
      const dropdownValues = await this.connection
        .collection("dropdownValues")
        .find({ category: "organizationType" })
        .toArray();

      for (const dropdown of dropdownValues) {
        const code = dropdown.code;
        const translations = dropdown.translations || [];

        const enTranslation = translations.find((t: any) => t.language === "en");
        const translationValue = enTranslation?.value;

        if (translationValue && code) {
          this.orgTypeMap.set(translationValue.toLowerCase(), code);
        }
      }

      console.log(`✅ Loaded ${this.orgTypeMap.size} organization types`);
    } catch (error) {
      console.warn("⚠️  Could not load organization types:", error);
    }
  }

  /**
   * Load industries from dropdown values
   */
  protected async loadIndustries(): Promise<void> {
    try {
      const dropdownValues = await this.connection
        .collection("dropdownValues")
        .find({ category: "industries" })
        .toArray();

      for (const dropdown of dropdownValues) {
        const code = dropdown.code;
        const translations = dropdown.translations || [];

        const enTranslation = translations.find((t: any) => t.language === "en");
        const translationValue = enTranslation?.value;

        if (translationValue && code) {
          this.industryMap.set(translationValue.toLowerCase(), code);
        }
      }

      console.log(`✅ Loaded ${this.industryMap.size} industries`);
    } catch (error) {
      console.warn("⚠️  Could not load industries:", error);
    }
  }

  /**
   * Match organization type from Excel to dropdown code
   */
  protected matchOrganizationType(excelValue: string | undefined): string | undefined {
    if (!excelValue) return undefined;

    const normalizedExcelValue = excelValue.toLowerCase().trim();

    // Direct match
    if (this.orgTypeMap.has(normalizedExcelValue)) {
      return this.orgTypeMap.get(normalizedExcelValue);
    }

    // Partial match - sort by length descending
    const sortedEntries = Array.from(this.orgTypeMap.entries()).sort(
      (a, b) => b[0].length - a[0].length,
    );

    for (const [dropdownValue, code] of sortedEntries) {
      if (normalizedExcelValue.includes(dropdownValue)) {
        return code;
      }
    }

    // Fuzzy match
    for (const [dropdownValue, code] of sortedEntries) {
      const dropdownWords = dropdownValue.split(/\s+/);
      const excelWords = normalizedExcelValue.split(/\s+/);

      const matchingWords = dropdownWords.filter(
        (word) =>
          word.length > 3 && excelWords.some((ew) => ew.includes(word) || word.includes(ew)),
      );

      if (matchingWords.length >= 2) {
        return code;
      }
    }

    return undefined;
  }

  /**
   * Match industries from Excel to dropdown codes
   */
  protected matchIndustries(excelValue: string | undefined): string[] {
    if (!excelValue || !excelValue.trim()) return [];

    const matchedCodes: string[] = [];

    // Split by common delimiters
    const industries = excelValue
      .replace(/[\r\n]+/g, ",")
      .split(/[,;]+/)
      .map((industry) => industry.trim())
      .filter((industry) => industry.length > 0);

    for (const industry of industries) {
      const normalizedIndustry = industry.toLowerCase();

      // Direct match
      if (this.industryMap.has(normalizedIndustry)) {
        const code = this.industryMap.get(normalizedIndustry)!;
        if (!matchedCodes.includes(code)) {
          matchedCodes.push(code);
        }
        continue;
      }

      // Partial match
      let matched = false;
      const sortedEntries = Array.from(this.industryMap.entries()).sort(
        (a, b) => b[0].length - a[0].length,
      );

      for (const [dropdownValue, code] of sortedEntries) {
        if (normalizedIndustry.includes(dropdownValue)) {
          if (!matchedCodes.includes(code)) {
            matchedCodes.push(code);
          }
          matched = true;
          break;
        }
      }

      // Fuzzy match
      if (!matched) {
        for (const [dropdownValue, code] of sortedEntries) {
          const dropdownWords = dropdownValue.split(/\s+/);
          const industryWords = normalizedIndustry.split(/\s+/);

          const matchingWords = dropdownWords.filter(
            (word) =>
              word.length > 3 && industryWords.some((iw) => iw.includes(word) || word.includes(iw)),
          );

          if (matchingWords.length >= 1) {
            if (!matchedCodes.includes(code)) {
              matchedCodes.push(code);
            }
            break;
          }
        }
      }
    }

    return matchedCodes;
  }

  /**
   * Geocode address with fallbacks
   */
  protected async geocodeAddress(address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  }): Promise<{ latitude?: number; longitude?: number }> {
    try {
      const standardizedCity = this.standardizeCityName(address.city);
      const standardizedCountry = this.standardizeCountryName(address.country);

      // Try full address
      let result = await this.geocodingService.getCoordinates({
        address: address.line1,
        city: standardizedCity,
        state: address.state,
        country: standardizedCountry,
        zipcode: address.zip,
      });

      // Fallback: city + country
      if (!result) {
        result = await this.geocodingService.getCoordinatesByCity(
          standardizedCity,
          standardizedCountry,
        );
      }

      // Fallback: country only
      if (!result) {
        result = await this.geocodingService.getCoordinatesByAddress(standardizedCountry);
      }

      if (result) {
        this.stats.geocodingSuccess++;
        return { latitude: result.latitude, longitude: result.longitude };
      } else {
        this.stats.geocodingFailed++;
        return {};
      }
    } catch (error) {
      this.stats.geocodingFailed++;
      return {};
    }
  }

  /**
   * Standardize country name
   */
  protected standardizeCountryName(country: string): string {
    const countryMap: Record<string, string> = {
      "democratic republic of the congo (kinshasa)": "Democratic Republic of the Congo",
      "democratic republic of congo": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo",
      "congo (kinshasa)": "Democratic Republic of the Congo",
      drc: "Democratic Republic of the Congo",
      "united states": "United States of America",
      usa: "United States of America",
      us: "United States of America",
      uk: "United Kingdom",
      uae: "United Arab Emirates",
    };

    const normalized = country.toLowerCase().trim();
    return countryMap[normalized] || country;
  }

  /**
   * Standardize city name
   */
  protected standardizeCityName(city: string): string {
    let cleaned = city.trim();
    cleaned = cleaned.replace(/^P\.O\.\s*Box\s+\d+[-\s]*/i, "");
    cleaned = cleaned.replace(/,?\s*(building|house|off)\s+.*/i, "");

    const parts = cleaned.split(",");
    if (parts.length > 0) {
      cleaned = parts[0].trim();
    }

    return cleaned;
  }

  /**
   * Split full name into first and last name
   */
  protected splitName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName || !fullName.trim()) {
      return { firstName: "", lastName: "" };
    }

    const nameParts = fullName.trim().split(/\s+/);

    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: "" };
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    return { firstName, lastName };
  }

  /**
   * Normalize email to lowercase
   */
  protected normalizeEmail(email: string): string {
    return email?.trim().toLowerCase() || "";
  }

  /**
   * Convert yes/no string to boolean
   */
  protected parseBoolean(value?: string): boolean {
    if (!value) return false;
    const normalized = value.toLowerCase().trim();
    return normalized === "yes" || normalized === "true" || normalized === "1";
  }

  /**
   * Parse number from string or number
   */
  protected parseNumber(value?: string | number): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const num = typeof value === "number" ? value : parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Get next member ID
   */
  protected async getNextMemberId(): Promise<string> {
    const counter = await this.connection.collection("counters").findOneAndUpdate(
      { name: "member" } as any,
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" },
    );

    const sequence = counter?.seq || 1;
    return `MEMBER-${String(sequence).padStart(3, "0")}`;
  }

  /**
   * Get next application number
   */
  protected async getNextApplicationNumber(): Promise<string> {
    const counter = await this.connection.collection("counters").findOneAndUpdate(
      { name: "application" } as any,
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" },
    );

    const sequence = counter?.seq || 1;
    return `APP-${String(sequence).padStart(3, "0")}`;
  }

  /**
   * Check if member already exists
   */
  protected async memberExists(companyName: string, email: string): Promise<boolean> {
    const existingMember = await this.connection.collection("members").findOne({
      $or: [
        { "organisationInfo.companyName": companyName },
        { "userSnapshots.email": email },
      ],
    });

    return !!existingMember;
  }

  /**
   * Read Excel file
   */
  protected readExcelFile(): TExcelRow[] {
    console.log(`📖 Reading Excel file: ${this.excelFilePath}`);
    const workbook = XLSX.readFile(this.excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: TExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✅ Found ${data.length} rows in Excel file`);
    return data;
  }

  /**
   * Write skipped entries to Excel
   */
  protected writeSkippedEntriesToExcel(
    skippedEntries: any[],
    outputFileName: string,
  ): void {
    if (skippedEntries.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(skippedEntries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Skipped Entries");
    XLSX.writeFile(workbook, outputFileName);
    console.log(`\n📝 Skipped entries written to: ${outputFileName}`);
  }

  /**
   * Print migration summary
   */
  protected printSummary(): void {
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Members created: ${this.stats.membersCreated}`);
    console.log(`   Members skipped: ${this.stats.membersSkipped}`);
    console.log(`   Users created: ${this.stats.usersCreated}`);
    console.log(`   Geocoding successful: ${this.stats.geocodingSuccess}`);
    console.log(`   Geocoding failed: ${this.stats.geocodingFailed}`);
    console.log(`   Errors: ${this.stats.errors}`);
  }

  /**
   * Abstract methods to be implemented by template-specific migrations
   */
  abstract parseExcelData(rows: TExcelRow[]): Promise<any[]>;
  abstract migrate(): Promise<void>;
}

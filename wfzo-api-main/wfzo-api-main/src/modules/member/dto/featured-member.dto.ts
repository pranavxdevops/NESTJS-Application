import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Featured Member Response DTO
 * Trimmed version of MemberInfo for featured member display
 */
export class FeaturedMemberDto {
  @ApiProperty({
    description: "Unique member identifier",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string;

  @ApiProperty({
    description: "Member code",
    example: "MEM-001",
  })
  memberCode!: string;

  @ApiProperty({
    description: "Company/Organization name",
    example: "Acme Free Zone",
  })
  name!: string;

  @ApiPropertyOptional({
    description: "URL to member logo",
    example: "https://cdn.example.com/logos/acme.png",
  })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: "Brief description of the organization",
    example: "Leading free zone organization in the region",
  })
  description?: string;

  @ApiProperty({
    type: [String],
    description: "List of industries the member operates in",
    example: ["Aerospace", "Automotive"],
  })
  industries!: string[];
}

/**
 * Partner Details Response DTO
 */
export class PartnerDetailsDto {
  @ApiProperty({ description: "Partner ID" })
  id!: string;

  @ApiProperty({ description: "Partner name" })
  name!: string;

  @ApiPropertyOptional({ description: "Partner logo URL" })
  logoUrl?: string;

  @ApiPropertyOptional({ description: "Partner website URL" })
  websiteUrl?: string;

  @ApiProperty({ type: [String], description: "Industries" })
  industries!: string[];
}

/**
 * Sponsor Details Response DTO
 */
export class SponsorDetailsDto {
  @ApiProperty({ description: "Sponsor ID" })
  id!: string;

  @ApiProperty({ description: "Sponsor name" })
  name!: string;

  @ApiPropertyOptional({ description: "Sponsor logo URL" })
  logoUrl?: string;

  @ApiPropertyOptional({ description: "Sponsor website URL" })
  websiteUrl?: string;

  @ApiProperty({ type: [String], description: "Industries" })
  industries!: string[];
}

/**
 * Partners and Sponsors Response DTO
 */
export class PartnersAndSponsorsDto {
  @ApiProperty({
    type: [PartnerDetailsDto],
    description: "List of partner organizations",
  })
  partners!: PartnerDetailsDto[];

  @ApiProperty({
    type: [SponsorDetailsDto],
    description: "List of sponsor organizations",
  })
  sponsors!: SponsorDetailsDto[];
}

/**
 * Member Coordinates for Map Display
 */
export class MemberMapCoordinatesDto {
  @ApiProperty({ description: "Member ID" })
  id!: string;

  @ApiProperty({ description: "Company name" })
  companyName!: string;

  @ApiProperty({ description: "Latitude coordinate" })
  latitude!: number;

  @ApiProperty({ description: "Longitude coordinate" })
  longitude!: number;

  @ApiPropertyOptional({ description: "Country" })
  country?: string;

  @ApiPropertyOptional({ description: "Country code (ISO 2-letter)" })
  countryCode?: string;

  @ApiPropertyOptional({ description: "City" })
  city?: string;

  @ApiPropertyOptional({ description: "Member logo URL" })
  memberLogoUrl?: string;

  @ApiProperty({ type: [String], description: "Industries" })
  industries!: string[];

  @ApiPropertyOptional({ description: "Membership category" })
  category?: string;

  @ApiPropertyOptional({ description: "Type of the organization" })
  typeOfTheOrganization?: string;

  @ApiPropertyOptional({ description: "Website URL" })
  websiteUrl?: string;
}

/**
 * Country Member Count
 */
export class CountryMemberCountDto {
  @ApiProperty({ description: "Country name" })
  country!: string;

  @ApiProperty({ description: "Member count" })
  count!: number;

  @ApiPropertyOptional({ description: "Country latitude (center)" })
  latitude?: number;

  @ApiPropertyOptional({ description: "Country longitude (center)" })
  longitude?: number;
}

/**
 * Member Map Data Response
 */
export class MemberMapDataDto {
  @ApiProperty({
    description: "Member count by continent",
    example: { "North America": 50, Europe: 120, Asia: 200 },
  })
  continentMemberCount!: Record<string, number>;

  @ApiProperty({
    type: [CountryMemberCountDto],
    description: "Member count by country",
  })
  countryMemberCount!: CountryMemberCountDto[];
}

export class MemberMapMemberResponseDto extends MemberMapDataDto {
  @ApiProperty({ type: [MemberMapCoordinatesDto] })
  companyMapData!: MemberMapCoordinatesDto[];

  @ApiProperty({ description: "Total active members considered" })
  totalMembers!: number;

  @ApiProperty({ description: "Members that have coordinates" })
  membersWithCoordinates!: number;
}

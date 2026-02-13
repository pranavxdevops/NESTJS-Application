import {
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  MaxLength,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

class FocalPointDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "john.doe@worldfzo.com" })
  @IsOptional()
  @IsEmail()
  email?: string;
}

class SecondaryContactDto {
  @ApiPropertyOptional({ example: "Jane Smith" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "jane.smith@company.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "Marketing Manager" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "+1" })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: "555-0123" })
  @IsOptional()
  @IsString()
  contactNumber?: string;
}

class CompanyPhotoDto {
  @ApiPropertyOptional({ example: "https://example.com/company-photo.jpg" })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: "company-photo.jpg" })
  @IsOptional()
  @IsString()
  fileName?: string;
}

class CompanyDetailsDto {
  @ApiPropertyOptional({ example: "WorldFZO Global Marketing" })
  @IsOptional()
  @IsString()
  marketingName?: string;

  @ApiPropertyOptional({
    type: CompanyPhotoDto,
    example: { url: "https://example.com/photo.jpg", fileName: "photo.jpg" },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyPhotoDto)
  companyPhoto?: CompanyPhotoDto;

  @ApiPropertyOptional({ example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
  @IsOptional()
  @IsUrl()
  corporateVideoLink?: string;

  @ApiPropertyOptional({
    example: "To collaborate on global free zone development and share best practices.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  whyJoinWorldFZO?: string;

  @ApiPropertyOptional({
    example:
      "A leading organization in free zone management, offering innovative solutions for economic development and investment attraction worldwide.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  companyDescription?: string;
}

class NewsletterDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  subscribed?: boolean;

  @ApiPropertyOptional({ example: ["extra1@example.com", "extra2@example.com"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEmail({}, { each: true })
  additionalEmails?: string[];
}

class FreeZoneInfoDto {
  @ApiPropertyOptional({
    type: FocalPointDto,
    example: { name: "Marketing Contact", email: "marketing@freezone.com" },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FocalPointDto)
  marketingFocalPoint?: FocalPointDto;

  @ApiPropertyOptional({
    type: FocalPointDto,
    example: { name: "Investor Contact", email: "investor@freezone.com" },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FocalPointDto)
  investorFocalPoint?: FocalPointDto;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAreaSqKm?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  foundedYear?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfCompanies?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeesInFreeZone?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeesInFreeZoneCompanies?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  jobsCreated?: number;

  @ApiPropertyOptional({ example: "Logistics, Warehousing, Consulting" })
  @IsOptional()
  @IsString()
  servicesOffered?: string;

  @ApiPropertyOptional({ example: "Manufacturing, Technology, Services" })
  @IsOptional()
  @IsString()
  mainActivitySectors?: string;

  @ApiPropertyOptional({ example: "0% corporate tax for 50 years, 100% foreign ownership" })
  @IsOptional()
  @IsString()
  incentivesAndTaxBenefits?: string;
}

class MemberNeedsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  consultingNeeded?: boolean;

  @ApiPropertyOptional({ example: "Business development, Marketing strategies" })
  @IsOptional()
  @IsString()
  consultingAreas?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  trainingNeeded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  attendEvents?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  customizedSolutionsRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  wantsGlobalSafeGreenSmartZoneRecognition?: boolean;
}

export class SubmitAdditionalInfoDto {
  @ApiPropertyOptional({
    type: SecondaryContactDto,
    example: {
      name: "Jane Smith",
      email: "jane.smith@company.com",
      position: "Marketing Manager",
      countryCode: "+1",
      contactNumber: "555-0123",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecondaryContactDto)
  secondaryContact?: SecondaryContactDto;

  @ApiPropertyOptional({
    type: CompanyDetailsDto,
    example: {
      marketingName: "WorldFZO Global",
      corporateVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      whyJoinWorldFZO: "To collaborate on global initiatives.",
      companyDescription: "Leading free zone authority.",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDetailsDto)
  companyDetails?: CompanyDetailsDto;

  @ApiPropertyOptional({
    type: NewsletterDto,
    example: { subscribed: true, additionalEmails: ["extra@example.com"] },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterDto)
  newsletter?: NewsletterDto;

  @ApiPropertyOptional({
    type: FreeZoneInfoDto,
    example: {
      totalAreaSqKm: 25,
      foundedYear: 2000,
      numberOfCompanies: 500,
      servicesOffered: "Logistics, Consulting",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FreeZoneInfoDto)
  freeZoneInfo?: FreeZoneInfoDto;

  @ApiPropertyOptional({
    type: MemberNeedsDto,
    example: { consultingNeeded: true, trainingNeeded: true, attendEvents: true },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberNeedsDto)
  memberNeeds?: MemberNeedsDto;
}

export class SaveAdditionalInfoDto {
  @ApiPropertyOptional({
    type: SecondaryContactDto,
    example: {
      name: "Jane Smith",
      email: "jane.smith@company.com",
      position: "Marketing Manager",
      countryCode: "+1",
      contactNumber: "555-0123",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecondaryContactDto)
  secondaryContact?: SecondaryContactDto;

  @ApiPropertyOptional({
    type: CompanyDetailsDto,
    example: {
      marketingName: "WorldFZO Global",
      corporateVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      whyJoinWorldFZO: "To collaborate on global initiatives.",
      companyDescription: "Leading free zone authority.",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDetailsDto)
  companyDetails?: CompanyDetailsDto;

  @ApiPropertyOptional({
    type: NewsletterDto,
    example: { subscribed: true, additionalEmails: ["extra@example.com"] },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterDto)
  newsletter?: NewsletterDto;

  @ApiPropertyOptional({
    type: FreeZoneInfoDto,
    example: {
      totalAreaSqKm: 25,
      foundedYear: 2000,
      numberOfCompanies: 500,
      servicesOffered: "Logistics, Consulting",
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FreeZoneInfoDto)
  freeZoneInfo?: FreeZoneInfoDto;

  @ApiPropertyOptional({
    type: MemberNeedsDto,
    example: { consultingNeeded: true, trainingNeeded: true, attendEvents: true },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberNeedsDto)
  memberNeeds?: MemberNeedsDto;
}

import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class OrganisationQuestionnaireDto {
  @ApiPropertyOptional({
    description: "Year the organisation was established",
    example: 2015,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  establishedYear?: number;

  @ApiPropertyOptional({
    description: "Number of employees in the organisation",
    example: 50,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  numberOfEmployees?: number;

  @ApiPropertyOptional({
    description: "Brief description about the company (company profile)",
    example: "Leading provider of innovative solutions in technology sector...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  companyProfileDescription?: string;

  @ApiPropertyOptional({
    description: "Reason for joining World FZO or testimony about membership benefits",
    example: "We joined to expand our network and access global free zone opportunities...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  whyJoinWorldFZO?: string;

  @ApiPropertyOptional({
    description: "Total size of free zone (surface area)",
    example: "50 sq km",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fzTotalSize?: string;

  @ApiPropertyOptional({
    description: "Year the free zone was founded",
    example: 2005,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  fzFoundedYear?: number;

  @ApiPropertyOptional({
    description: "Number of companies operating in the free zone",
    example: 500,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  fzNumberOfCompanies?: number;

  @ApiPropertyOptional({
    description: "Number of employees in the free zone",
    example: 100,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  fzNumberOfEmployees?: number;

  @ApiPropertyOptional({
    description: "Number of jobs created by the free zone through tenants",
    example: 5000,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  fzJobsCreated?: number;

  @ApiPropertyOptional({
    description: "Benefits offered by the free zone in terms of services",
    example: "Customs clearance, logistics support, IT infrastructure...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fzServicesBenefits?: string;

  @ApiPropertyOptional({
    description: "Main activity sectors represented in the free zone",
    example: "Logistics, manufacturing, technology, healthcare...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fzMainActivitySectors?: string;

  @ApiPropertyOptional({
    description: "Benefits offered by the free zone in terms of incentives/tax",
    example: "0% corporate tax, customs exemptions, 100% foreign ownership...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  fzTaxIncentives?: string;

  @ApiPropertyOptional({
    description: "Indicates if organization has consulting needs",
    example: true,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  needsConsulting?: boolean;

  @ApiPropertyOptional({
    description: "Areas where World FZO experts can assist to improve the free zone",
    example: "Marketing strategy, operational efficiency, technology adoption...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  needsConsultingAreas?: string;

  @ApiPropertyOptional({
    description: "Indicates if organization has training needs",
    example: true,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  needsTraining?: boolean;

  @ApiPropertyOptional({
    description: "Areas where training is needed",
    example: "Staff development, compliance training, digital transformation...",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  needsTrainingAreas?: string;

  @ApiPropertyOptional({
    description: "Interest in attending World FZO conferences/seminars/webinars",
    example: true,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  attendConferences?: boolean;

  @ApiPropertyOptional({
    description: "Interest in customized events for specific needs",
    example: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  customizedEvents?: boolean;

  @ApiPropertyOptional({
    description: "Interest in becoming a Global Safe, Green or Smart Zone recognized free zone",
    example: true,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  recognizedFreeZone?: boolean;

  // Associate Member specific field
  @ApiPropertyOptional({
    description:
      "How did you hear about World FZO? (Associate Member only) - Used for tracking referral sources",
    example: "LinkedIn",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  howDidYouHearAboutWorldFZO?: string;
}

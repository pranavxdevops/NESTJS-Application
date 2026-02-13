import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import { OrganisationQuestionnaireDto } from "./organisation-questionnaire.dto";
import { AddressDto } from "./address.dto";

export class SocialMediaHandleDto {
  @ApiPropertyOptional({
    description: "Social media platform title",
    example: "facebook",
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: "Social media profile URL",
    example: "https://facebook.com/company",
  })
  @IsUrl()
  url!: string;
}

export class OrganisationInfoDto {
  @ApiPropertyOptional({
    description: "Type of the organization",
    example: "Private Limited Company",
  })
  @IsString()
  @IsOptional()
  typeOfTheOrganization?: string;

  @ApiPropertyOptional({
    description: "Name of the company/organisation. Required in Phase 1, optional in updates.",
    example: "Acme Corporation",
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Website URL of the organisation. Required in Phase 1, optional in updates.",
    example: "https://www.acme.com",
  })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: "LinkedIn profile URL",
    example: "https://www.linkedin.com/company/acme",
  })
  @IsUrl()
  @IsOptional()
  linkedInUrl?: string;

  @ApiPropertyOptional({
    description: "Industries the organisation operates in",
    example: ["Technology", "Manufacturing"],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  industries?: string[];

  @ApiPropertyOptional({
    description: "URL of the member's logo image",
    example: "https://cdn.example.com/logos/acme.png",
  })
  @IsString()
  @IsOptional()
  memberLogoUrl?: string;

  @ApiPropertyOptional({
    description: "URL of the organisation's image",
    example: "https://cdn.example.com/images/acme-building.jpg",
  })
  @IsUrl()
  @IsOptional()
  organisationImageUrl?: string;

  @ApiPropertyOptional({
    description: "URL of the member's video",
    example: "https://cdn.example.com/videos/acme-intro.mp4",
  })
  @IsUrl()
  @IsOptional()
  memberVideoUrl?: string;

  @ApiPropertyOptional({
    description: "Organisation questionnaire responses",
    type: () => OrganisationQuestionnaireDto,
  })
  @ValidateNested()
  @Type(() => OrganisationQuestionnaireDto)
  @IsOptional()
  organisationQuestionnaire?: OrganisationQuestionnaireDto;

  @ApiPropertyOptional({
    description: "Physical address of the member organization",
    type: () => AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiPropertyOptional({
    description: "Name of the authorized signatory",
    example: "John Doe",
  })
  @IsString()
  @IsOptional()
  signatoryName?: string;

  @ApiPropertyOptional({
    description: "Position of the authorized signatory",
    example: "CEO",
  })
  @IsString()
  @IsOptional()
  signatoryPosition?: string;

  @ApiPropertyOptional({
    description: "Digital signature or signature data",
    example: "data:image/png;base64,iVBORw0KGgoAAAANS...",
  })
  @IsString()
  @IsOptional()
  signature?: string;

  // Associate Member specific field
  @ApiPropertyOptional({
    description: "URL of the member's licence",
    example: "https://cdn.example.com/licences/member-licence.pdf",
  })
  @IsString()
  @IsOptional()
  memberLicenceUrl?: string;

  @ApiPropertyOptional({
    description: "Position/role of the member within organization (Associate Member only)",
    example: "Marketing Director",
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({
    description: "Contact phone number for the organization",
    example: "+91-364-784-8484",
  })
  @IsString()
  @IsOptional()
  organisationContactNumber?: string;

  @ApiPropertyOptional({
    description: "Social media handles for the organization",
    type: () => [SocialMediaHandleDto],
    example: [
      { title: "facebook", url: "https://facebook.com/company" },
      { title: "twitter", url: "https://twitter.com/company" }
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => SocialMediaHandleDto)
  @IsOptional()
  socialMediaHandle?: SocialMediaHandleDto[];
}

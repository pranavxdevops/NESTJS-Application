import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OrganisationInfoDto } from "./organisation-info.dto";

/**
 * Generic DTO for updating any field in member
 * Allows partial updates with any valid member field
 */
export class GenericUpdateMemberDto {
  @ApiPropertyOptional({
    description: "Whether this member should be featured on the website",
    example: true,
  })
  @IsOptional()
  featuredMember?: boolean;

  @ApiPropertyOptional({
    description: "Allowed user count - will be added to current value if provided",
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  allowedUserCount?: number;

  @ApiPropertyOptional({
    description: "Organisation information - will be merged with existing data instead of replacing",
    type: () => OrganisationInfoDto,
    example: {
      companyName: "Updated Company Name",
      industries: ["technology", "manufacturing"],
      socialMediaHandle: [
        { title: "facebook", url: "https://facebook.com/company" }
      ]
    },
  })
  @ValidateNested()
  @Type(() => OrganisationInfoDto)
  @IsOptional()
  organisationInfo?: OrganisationInfoDto;

  // Allow any additional properties for generic updates
  [key: string]: any;
}
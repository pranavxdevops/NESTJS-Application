import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { MemberConsentDto } from "./member-consent.dto";
import { OrganisationInfoDto } from "./organisation-info.dto";
import { MemberUserDto } from "./member-user.dto";
import { ValidateMemberCategory } from "../validators/decorators/validate-member-category.decorator";
import { ValidateDropdownValue } from "../validators/decorators/validate-dropdown-value.decorator";

/**
 * CreateMemberDto represents the MemberInfo schema from api-spec.yml
 * This is used for creating new member records with full organizational details
 */
export class CreateMemberDto {
  @ApiProperty({
    description:
      "Array of user information for members. At least one user is required in Phase 1. The system will create users if they don't exist, or update them if id is provided.",
    type: [MemberUserDto],
    isArray: true,
    minItems: 1,
    example: [
      {
        username: "john.doe@example.com",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        userType: "Primary",
        designation: "Chief Executive Officer",
        contactNumber: "+971-50-123-4567",
        correspondanceUser: false,
        newsLetterSubscription: true,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one user is required for the member organization" })
  @ValidateNested({ each: true })
  @Type(() => MemberUserDto)
  memberUsers!: MemberUserDto[];

  @ApiProperty({
    description:
      "Membership category. Values are validated against the dropdownValues collection (category: 'membershipCategory'). Use GET /masterdata/dropdowns/category/membershipCategory to fetch available options.",
    example: "votingMember",
  })
  @IsString()
  @IsNotEmpty()
  @ValidateDropdownValue("membershipCategory", {
    message: "Invalid membership category. Please select from available options in the dropdown.",
  })
  category!: string;

  @ApiPropertyOptional({
    description:
      "Membership tier within the category. Values are validated against the dropdownValues collection (category: 'tier'). Use GET /masterdata/dropdowns/category/tier to fetch available options.",
    example: "basic",
  })
  @IsString()
  @IsOptional()
  @ValidateDropdownValue("tier", {
    message: "Invalid tier. Please select from available options in the dropdown.",
  })
  tier?: string;

  @ApiPropertyOptional({
    description:
      "Organization details including company name, website, and questionnaire responses. In Phase 1, provide basic org info (companyName, websiteUrl, typeOfTheOrganization, industries, position).",
    type: () => OrganisationInfoDto,
    example: {
      typeOfTheOrganization: "Private Limited Company",
      companyName: "Test Corporation",
      websiteUrl: "https://www.acme.com",
      industries: ["Technology", "Manufacturing"],
      memberLogoUrl:
        "https://stwfzouaenorth001.blob.core.windows.net/wfzo-assets/images/1762565481210-b3a562ac-2199-43af-9882-2438b5af1342",
      position: "Marketing Director",
      organisationContactNumber: "+91-364-784-8484",
    },
  })
  @ValidateNested()
  @Type(() => OrganisationInfoDto)
  @IsOptional()
  organisationInfo?: OrganisationInfoDto;

  @ApiPropertyOptional({
    description:
      "Member consent for communications and data sharing. In Phase 1, only authorizedPersonDeclaration is collected. Full consents (articleOfAssociationConsent, memberShipFeeConsent) are collected in Phase 2.",
    type: () => MemberConsentDto,
    example: {
      authorizedPersonDeclaration: true,
    },
  })
  @ValidateNested()
  @Type(() => MemberConsentDto)
  @IsOptional()
  memberConsent?: MemberConsentDto;

  /**
   * Category-specific validation trigger
   * This field uses a custom decorator to validate the entire DTO based on the membership category.
   * It automatically routes to VotingMemberValidator or AssociateMemberValidator as needed.
   *
   * @internal This field is only used for validation and is not persisted
   */
  @ValidateMemberCategory({
    message: "Category-specific validation failed",
  })
  @ApiPropertyOptional({
    description: "Internal validation field - validates category-specific requirements",
    example: null,
  })
  @IsOptional()
  categoryValidation?: any;
}

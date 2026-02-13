import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class MemberConsentDto {
  @ApiPropertyOptional({
    description:
      "Consent to Article of Association. Required for voting members, optional for others.",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  articleOfAssociationConsent?: boolean;

  @ApiPropertyOptional({
    description: "Consent to Article of Association criteria",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  articleOfAssociationCriteriaConsent?: boolean;

  @ApiPropertyOptional({
    description: "Consent to membership fee. Required for voting members, optional for others.",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  memberShipFeeConsent?: boolean;

  @ApiPropertyOptional({
    description: "Consent to publication",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  publicationConsent?: boolean;

  @ApiPropertyOptional({
    description: "Approval for exposure on World FZO websites and publications",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  approvalForExposure?: boolean;

  @ApiPropertyOptional({
    description: "Acceptance of terms and conditions",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  termsAndConditions?: boolean;

  // Associate Member specific consent fields
  @ApiPropertyOptional({
    description: "Acceptance of terms and conditions 2 (Associate Member only)",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  termsAndConditions2?: boolean;

  @ApiPropertyOptional({
    description: "Acceptance of terms and conditions 3 (Associate Member only)",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  termsAndConditions3?: boolean;

  @ApiPropertyOptional({
    description: "Declaration by authorized person",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  authorizedPersonDeclaration?: boolean;
}

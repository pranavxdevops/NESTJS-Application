import { BadRequestException } from "@nestjs/common";
import { CreateMemberDto } from "../dto/create-member.dto";

/**
 * Associate Member Category Validator
 *
 * Contains all validation logic specific to Associate Member category.
 * This validator is invoked when a member with category "associateMember" is created.
 *
 * Associate Member Requirements:
 * - Must consent to terms and conditions 2 & 3 (simplified consents)
 * - Must provide company name and website URL
 * - Should provide referral source (howDidYouHearAboutWorldFZO)
 * - Should provide position
 * - Should use simplified questionnaire (not full FZ questionnaire)
 */
export class AssociateMemberValidator {
  /**
   * Validate associate member specific requirements
   * @throws BadRequestException if validation fails
   */
  static validate(dto: CreateMemberDto): void {
    this.validateConsents(dto);
    this.validateOrganisationInfo(dto);
  }

  /**
   * Validate required consent fields for associate members
   */
  private static validateConsents(dto: CreateMemberDto): void {
    if (!dto.memberConsent) {
      throw new BadRequestException("Member consent information is required for associate members");
    }

    // Common consent for all members in Phase 1
    if (!dto.memberConsent.authorizedPersonDeclaration) {
      throw new BadRequestException(
        "Authorized person declaration is required for associate members in Phase 1",
      );
    }

    // Associate members have simplified consent requirements
    if (!dto.memberConsent.termsAndConditions2) {
      throw new BadRequestException(
        "Terms and conditions (2) consent is required for associate members",
      );
    }

    if (!dto.memberConsent.termsAndConditions3) {
      throw new BadRequestException(
        "Terms and conditions (3) consent is required for associate members",
      );
    }
  }

  /**
   * Validate required organisation info fields for associate members
   */
  private static validateOrganisationInfo(dto: CreateMemberDto): void {
    if (!dto.organisationInfo) {
      throw new BadRequestException("Organisation information is required for associate members");
    }

    if (!dto.organisationInfo.companyName) {
      throw new BadRequestException("Company name is required for associate members");
    }

    if (!dto.organisationInfo.websiteUrl) {
      throw new BadRequestException("Website URL is required for associate members");
    }
  }
}

import { BadRequestException } from "@nestjs/common";
import { CreateMemberDto } from "../dto/create-member.dto";

/**
 * Voting Member Category Validator
 *
 * Contains all validation logic specific to Voting Member category.
 * This validator is invoked when a member with category "votingMember" or "zoneMember" is created.
 *
 * Voting Member Requirements:
 * - Must consent to Article of Association
 * - Must consent to membership fees
 * - Must provide company name and website URL
 * - Should provide organizational questionnaire (recommended)
 * - Should provide FZ-specific fields for complete profile
 */
export class VotingMemberValidator {
  /**
   * Validate voting member specific requirements
   * @throws BadRequestException if validation fails
   */
  static validate(dto: CreateMemberDto): void {
    this.validateConsents(dto);
    this.validateOrganisationInfo(dto);
  }

  /**
   * Validate required consent fields for voting members
   */
  private static validateConsents(dto: CreateMemberDto): void {
    if (!dto.memberConsent) {
      throw new BadRequestException("Member consent information is required for voting members");
    }

    if (!dto.memberConsent.articleOfAssociationConsent) {
      throw new BadRequestException(
        "Article of Association consent is required for voting members",
      );
    }

    if (!dto.memberConsent.memberShipFeeConsent) {
      throw new BadRequestException("Membership fee consent is required for voting members");
    }
  }

  /**
   * Validate required organisation info fields for voting members
   */
  private static validateOrganisationInfo(dto: CreateMemberDto): void {
    if (!dto.organisationInfo) {
      throw new BadRequestException("Organisation information is required for voting members");
    }

    if (!dto.organisationInfo.companyName) {
      throw new BadRequestException("Company name is required for voting members");
    }

    if (!dto.organisationInfo.websiteUrl) {
      throw new BadRequestException("Website URL is required for voting members");
    }
  }
}

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { BadRequestException } from "@nestjs/common";
import { CreateMemberDto } from "../../dto/create-member.dto";
import { VotingMemberValidator } from "../voting-member.validator";
import { AssociateMemberValidator } from "../associate-member.validator";

/**
 * Custom validator constraint for category-specific member validation
 *
 * This validator is triggered during DTO validation and routes to the
 * appropriate category-specific validator based on the membership category.
 */
@ValidatorConstraint({ name: "validateMemberCategory", async: false })
export class ValidateMemberCategoryConstraint implements ValidatorConstraintInterface {
  private lastError: Error | null = null;

  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CreateMemberDto;

    try {
      // Route to appropriate validator based on category (string comparison)
      const category = String(dto.category);

      switch (category) {
        case "votingMember":
        case "zoneMember": // Legacy category
          VotingMemberValidator.validate(dto);
          break;

        case "associateMember":
          AssociateMemberValidator.validate(dto);
          break;

        case "partnerObserver":
          // Basic validation for partner observers
          if (!dto.memberConsent?.authorizedPersonDeclaration) {
            throw new BadRequestException(
              "Authorized person declaration is required for partner observers in Phase 1",
            );
          }
          break;

        // Legacy categories - no specific validation (backward compatibility)
        case "freeZoneAssociation":
        case "corporateMembers":
        case "professionalMembers":
        case "strategicMembers":
          break;

        default:
          return false; // Invalid category
      }

      return true; // Validation passed
    } catch (error) {
      // Validation failed - error message will be shown
      // Store error for defaultMessage
      this.lastError = error instanceof Error ? error : new Error(String(error));
      return false;
    }
  }

  defaultMessage(): string {
    if (this.lastError && this.lastError.message) {
      return this.lastError.message;
    }
    return "Member category validation failed";
  }
}

/**
 * Decorator: Validate Member Category
 *
 * Apply this decorator to CreateMemberDto to trigger category-specific validation.
 * This decorator will automatically route to the correct validator based on the
 * membership category field.
 *
 * @example
 * ```typescript
 * export class CreateMemberDto {
 *   @IsEnum(MembershipCategory)
 *   category!: MembershipCategory;
 *
 *   @ValidateMemberCategory()
 *   validateCategory?: any; // Validation trigger field
 * }
 * ```
 *
 * Usage:
 * - The decorator validates the entire DTO based on the category field
 * - Throws BadRequestException if validation fails
 * - Integrates seamlessly with NestJS ValidationPipe
 */
export function ValidateMemberCategory(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateMemberCategoryConstraint,
    });
  };
}

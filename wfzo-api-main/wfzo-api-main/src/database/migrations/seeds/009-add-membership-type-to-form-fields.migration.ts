import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { FormField } from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Add membershipType field to existing form fields
 *
 * This migration updates all existing form fields to include the membershipType field.
 * - Fields common to all membership types are marked as "common"
 * - Voting member specific fields are marked as "votingMember"
 *
 * This is a data migration that doesn't change the schema (schema was already updated)
 */
export class AddMembershipTypeToFormFieldsMigration implements Migration {
  name = "009-add-membership-type-to-form-fields";

  constructor(private readonly formFieldModel: Model<FormField>) {}

  async up(): Promise<void> {
    console.log("Adding membershipType field to existing form fields...");

    // Fields that are common across all membership types
    const commonFields = [
      "fullLegalNameOfTheOrganization",
      "websiteUrl",
      "linkedInUrl",
      "companyName",
      "establishedYear",
      "numberOfEmployees",
      "signatoryName",
      "signatoryPosition",
      "signature",
      "addressLine1",
      "addressLine2",
      "addressCity",
      "addressState",
      "addressCountry",
      "addressZip",
      "primaryContactFirstName",
      "primaryContactLastName",
      "primaryContactEmail",
      "primaryContactDesignation",
      "primaryContactNumber",
      "secondaryContactFirstName",
      "secondaryContactLastName",
      "secondaryContactEmail",
      "secondaryContactDesignation",
      "secondaryContactNumber",
      "termsAndConditions",
    ];

    // Update common fields
    await this.formFieldModel.updateMany(
      { fieldKey: { $in: commonFields } },
      { $set: { membershipType: "common" } },
    );

    // Update all other existing fields (from migration 007) to votingMember
    await this.formFieldModel.updateMany(
      {
        fieldKey: { $nin: commonFields },
        membershipType: { $exists: false }, // Only update if not already set
      },
      { $set: { membershipType: "votingMember" } },
    );

    // Set default for any fields that still don't have membershipType
    await this.formFieldModel.updateMany(
      { membershipType: { $exists: false } },
      { $set: { membershipType: "common" } },
    );

    console.log("✓ Membership type field added to form fields");
  }

  async down(): Promise<void> {
    console.log("Removing membershipType field from form fields...");

    // Remove the membershipType field from all documents
    await this.formFieldModel.updateMany({}, { $unset: { membershipType: "" } });

    console.log("✓ Membership type field removed from form fields");
  }
}

import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  FormField,
  FormFieldType,
  SupportedLanguage,
} from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Seed form fields for World FZO Associate Member Application Form
 *
 * This migration populates the formFields collection with all fields from the
 * World FZO Membership Application Form - Associate Member
 *
 * Many fields are reused from common fields (marked as "common" membershipType).
 * Associate-specific fields are marked as "associateMember".
 *
 * Form sections:
 * - contactInformation (primary contact details)
 * - organizationInformation (company details and address)
 * - questionnaire (brief company profile, motivation)
 * - newsletter (subscription preferences)
 * - consent (terms and conditions)
 */
export class AssociateMemberFormFieldsMigration implements Migration {
  name = "010-associate-member-form-fields";

  constructor(private readonly formFieldModel: Model<FormField>) {}

  async up(): Promise<void> {
    console.log("Seeding World FZO Associate Member Application Form fields...");

    const formFields: Partial<FormField>[] = [
      // ==================== SECTION: contactInformation ====================
      // Note: firstName, lastName, email, designation, telephone, mobile fields
      // are reused from common primaryContact fields

      {
        fieldKey: "position",
        fieldType: FormFieldType.TEXT,
        section: "contactInformation",
        membershipType: "associateMember",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Position",
            label: "Position",
            placeholder: "Enter your position",
            helpText: "Your job title or position in the organization",
          },
        ],
        displayOrder: 1,
      },

      // ==================== SECTION: organizationInformation ====================
      // Reusing: companyName, websiteUrl, fullLegalNameOfTheOrganization,
      // establishedYear, numberOfEmployees from common fields

      {
        fieldKey: "howDidYouHearAboutWorldFZO",
        fieldType: FormFieldType.DROPDOWN,
        section: "questionnaire",
        dropdownCategory: "referralSource",
        membershipType: "associateMember",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "How Did You Hear About the World FZO?",
            label: "How Did You Hear About the World FZO?",
            placeholder: "Select source",
            helpText: "Help us understand how you found World FZO",
          },
        ],
        displayOrder: 10,
      },

      {
        fieldKey: "companyProfileDescriptionAssociate",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        membershipType: "associateMember",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Write a Brief Description About Your Company (Company Profile)",
            label: "Write a Brief Description About Your Company (Company Profile)",
            placeholder:
              "Provide a brief overview of your company, services, and value proposition...",
            helpText: "Brief company description for World FZO records",
          },
        ],
        displayOrder: 11,
      },

      // ==================== Address subsection ====================
      // Reusing: addressLine1, addressLine2, addressCity, addressState,
      // addressCountry, addressZip from common fields

      // ==================== SECTION: consent ====================
      // Reusing: termsAndConditions, signatoryName, signature from common fields

      {
        fieldKey: "termsAndConditions3",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        membershipType: "associateMember",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Terms and Conditions (Data Processing)",
            label: "Terms and Conditions (Data Processing)",
            helpText: "I consent to data processing as per privacy policy",
          },
        ],
        displayOrder: 91,
      },

      // ==================== Metadata fields ====================
      {
        fieldKey: "applicationDate",
        fieldType: FormFieldType.DATE,
        section: "metadata",
        membershipType: "common",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Application Date",
            label: "Application Date",
            helpText: "Date when the application was submitted",
          },
        ],
        displayOrder: 100,
      },
    ];

    // Use bulkWrite for efficient upsert operations
    const bulkOps = formFields.map((field) => ({
      updateOne: {
        filter: { fieldKey: field.fieldKey },
        update: { $set: field },
        upsert: true,
      },
    }));

    const result = await this.formFieldModel.bulkWrite(bulkOps);

    console.log(
      `✓ Associate Member Form Fields migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing World FZO Associate Member Application Form fields...");

    const associateSpecificFieldKeys = [
      "position",
      "howDidYouHearAboutWorldFZO",
      "companyProfileDescriptionAssociate",
      "termsAndConditions2",
      "termsAndConditions3",
    ];

    // Only remove associate-specific fields, keep common fields
    await this.formFieldModel.deleteMany({
      fieldKey: { $in: associateSpecificFieldKeys },
    });

    console.log("✓ Associate Member Form Fields removed");
  }
}

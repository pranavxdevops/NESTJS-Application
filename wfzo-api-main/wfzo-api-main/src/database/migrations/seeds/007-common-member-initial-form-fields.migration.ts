import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  FormField,
  FormFieldType,
  SupportedLanguage,
} from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Seed form fields for World FZO Voting Member Application Form
 *
 * This migration populates the formFields collection with all fields from the
 * World FZO Membership Application Form - Voting (301)
 *
 * Form sections and subsections:
 * - organizationInformation (basic details, address subsection)
 * - userInformation (primaryContact, secondaryContact, marketingContact, investorContact subsections)
 * - questionnaire (free zone info, member needs)
 * - newsletter (subscription preferences)
 * - consent (approvals and terms)
 */
export class CommonMemberInitialFormFieldsMigration implements Migration {
  name = "007-common-member-initial-form-fields";

  constructor(private readonly formFieldModel: Model<FormField>) {}

  async up(): Promise<void> {
    console.log("Seeding World FZO Common Member Application Form fields...");

    const formFields: Partial<FormField>[] = [
      // ==================== SECTION TITLES ====================
      {
        fieldKey: "organizationInformation",
        fieldType: FormFieldType.TEXT,
        section: "title",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Organization Details",
            label: "Organization Details",
            helpText: "Section title for organization information",
          },
        ],
        displayOrder: 0,
      },
      {
        fieldKey: "primaryContact",
        fieldType: FormFieldType.TEXT,
        section: "title",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Personal Details",
            label: "Personal Details",
            helpText: "Section title for primary contact information",
          },
        ],
        displayOrder: 7.5,
      },
      {
        fieldKey: "organisationAddress",
        fieldType: FormFieldType.TEXT,
        section: "title",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Organisation Address",
            label: "Organisation Address",
            helpText: "Section title for organisation address information",
          },
        ],
        displayOrder: 15.5,
      },
      {
        fieldKey: "consent",
        fieldType: FormFieldType.TEXT,
        section: "title",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Terms & Conditions",
            label: "Terms & Conditions",
            helpText: "Section title for terms and conditions information",
          },
        ],
        displayOrder: 20.5,
      },
      // ==================== member-registration-phase1 SUBSECTION: Consent ====================
      {
        fieldKey: "authorizedPersonDeclaration",
        fieldType: FormFieldType.CHECKBOX,
        section: "organizationInformation",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "I'm authorized to sign up on behalf of my organization",
            label: "I'm authorized to sign up on behalf of my organization",
            helpText: "TBU",
          },
        ],
        displayOrder: 1,
      },
      // ==================== member-registration-phase1 ORGANIZATION INFORMATION ====================
      {
        fieldKey: "fullLegalNameOfTheOrganization",
        fieldType: FormFieldType.TEXT,
        section: "organizationInformation",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Organization Name",
            label: "Organization Name",
            placeholder: "Enter organization name",
            helpText: "Provide the complete legal name as registered",
          },
        ],
        displayOrder: 2,
      },
      {
        fieldKey: "typeOfTheOrganization",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationInformation",
        dropdownCategory: "organizationType",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Organization Type",
            label: "Organization Type",
            placeholder: "Select organization type",
            helpText: "Select the category that best describes your organization",
          },
        ],
        displayOrder: 3,
      },
      {
        fieldKey: "industries",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationInformation",
        page: "member-registration-phase1",
        dropdownCategory: "industries",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Select Your Company's Industry",
            label: "Select Your Company's Industry",
            placeholder: "Choose an industry",
            helpText: "Industry your company operates in",
          },
        ],
        fieldsPerRow: 2,
        displayOrder: 4,
      },

      {
        fieldKey: "websiteUrl",
        fieldType: FormFieldType.URL,
        section: "organizationInformation",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Website",
            label: "Website",
            placeholder: "https://www.company.com",
            helpText: "Company website URL",
          },
        ],
        displayOrder: 5,
      },

      {
        fieldKey: "organizationContactNumber",
        fieldType: FormFieldType.PHONE,
        section: "organizationInformation",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Contact Number",
            label: "Contact Number",
            placeholder: "+1 (555) 987-6543",
            helpText: "Phone number with country code",
          },
        ],
        displayOrder: 6,
      },
      {
        fieldKey: "membershipCategory",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationInformation",
        dropdownCategory: "membershipCategory",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Membership Type",
            label: "Membership Type",
            placeholder: "Select membership type",
            helpText: "Choose the membership type you wish to apply for",
          },
        ],
        displayOrder: 7,
      },
      // Phase 2 document uploads
      {
        fieldKey: "licesnseDocumentUpload",
        fieldType: FormFieldType.BUTTON,
        section: "organizationInformation",
        subSection: "documents",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Upload Organisation License Document",
            label: "Upload Organisation License Document",
          },
        ],
        displayOrder: 8,
      },
      {
        fieldKey: "logoDocumentUpload",
        fieldType: FormFieldType.BUTTON,
        section: "organizationInformation",
        subSection: "documents",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Upload Organisation Logo",
            label: "Upload Organisation Logo",
          },
        ],
        displayOrder: 9,
      },
      // ==================== member-registration-phase1 SUBSECTION: primaryContact ====================
      {
        fieldKey: "primaryContactFirstName",
        fieldType: FormFieldType.TEXT,
        section: "primaryContact",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Primary Contact (First Name)",
            label: "Primary Contact (First Name)",
            placeholder: "Enter contact person's first name",
            helpText: "First name of the main contact person",
          },
        ],
        displayOrder: 10,
      },
      {
        fieldKey: "primaryContactLastName",
        fieldType: FormFieldType.TEXT,
        section: "primaryContact",
        fieldsPerRow: 2,
        page: "member-registration-phase1",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Primary Contact (Last Name)",
            label: "Primary Contact (Last Name)",
            placeholder: "Enter contact person's last name",
            helpText: "Last name of the main contact person",
          },
        ],
        displayOrder: 11,
      },
      {
        fieldKey: "primaryContactEmail",
        fieldType: FormFieldType.EMAIL,
        section: "primaryContact",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Primary Contact Email",
            label: "Primary Contact Email",
            placeholder: "contact@company.com",
            helpText: "Work email address for official communications",
          },
        ],
        displayOrder: 12,
      },

      {
        fieldKey: "primaryContactNumber",
        fieldType: FormFieldType.PHONE,
        section: "primaryContact",
        page: "member-registration-phase1",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Contact Number",
            label: "Contact Number",
            placeholder: "+1 (555) 987-6543",
            helpText: "Phone number with country code",
          },
        ],
        displayOrder: 13,
      },
      {
        fieldKey: "primaryContactDesignation",
        fieldType: FormFieldType.TEXT,
        section: "primaryContact",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Position",
            label: "Position",
            placeholder: "Job title",
            helpText: "Current position/title in the organization",
          },
        ],
        displayOrder: 14,
      },
      {
        fieldKey: "primaryNewsLetterSubscription",
        fieldType: FormFieldType.CHECKBOX,
        section: "primaryContact",
        page: "member-registration-phase1",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "I want to receive regular updates and industry insights from the World FZO.",
            label: "I want to receive regular updates and industry insights from the World FZO.",
            helpText: "TBU",
          },
        ],
        displayOrder: 15,
      },

      // ==================== member-registration-phase2 SUBSECTION: address ====================
      {
        fieldKey: "addressLine1",
        fieldType: FormFieldType.TEXT,
        section: "organizationAddress",
        subSection: "address",
        page: "member-registration-phase2",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Address Line 1",
            label: "Address Line 1",
            placeholder: "Street address, P.O. box, building name",
            helpText: "Primary address line",
          },
        ],
        displayOrder: 16,
      },
      {
        fieldKey: "addressLine2",
        fieldType: FormFieldType.TEXT,
        section: "organizationAddress",
        subSection: "address",
        fieldsPerRow: 2,
        page: "member-registration-phase2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Address Line 2",
            label: "Address Line 2",
            placeholder: "Suite, apartment, building, floor, etc.",
            helpText: "Additional address information (optional)",
          },
        ],
        displayOrder: 17,
      },
      {
        fieldKey: "addressCity",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationAddress",
        subSection: "address",
        page: "member-registration-phase2",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "City",
            label: "City",
            placeholder: "Enter city",
            helpText: "City or locality",
          },
        ],
        displayOrder: 20,
      },
      {
        fieldKey: "addressState",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationAddress",
        subSection: "address",
        page: "member-registration-phase2",
        fieldsPerRow: 2,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "State/Province",
            label: "State/Province",
            placeholder: "Enter state or province",
            helpText: "State, province, or region",
          },
        ],
        displayOrder: 19,
      },
      {
        fieldKey: "addressCountry",
        fieldType: FormFieldType.DROPDOWN,
        section: "organizationAddress",
        subSection: "address",
        fieldsPerRow: 2,
        page: "member-registration-phase2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Country",
            label: "Country",
            placeholder: "Enter country",
            helpText: "Country name",
          },
        ],
        displayOrder: 18,
      },

      // ==================== member-registration-phase2 Consent Section ====================
      {
        fieldKey: "articleOfAssociationConsent",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Article of Association Consent",
            label: "I hereby agree that i have read, understood to fully support and be bound by the Articles of Association and Policy of the World FZO and to be admitted as a member of the Organization",
            helpText: "Article of Association Consent",
          },
        ],
        displayOrder: 21,
      },
      {
        fieldKey: "articleOfAssociationCriteriaConsent",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        fieldsPerRow: 1,
        page: "member-registration-phase2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Article of Association Criteria Consent",
            label: "I also confirm that my organization or entity meets each of the criteria set out below in Criteria of Admission in the Articles of Association",
            helpText: "Article of Association Criteria Consent",
          },
        ],
        displayOrder: 22,
      },
      {
        fieldKey: "memberShipFeeConsent",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Membership Fee Consent",
            label: "I am Obliged to pay the Annual Membership fees.Membership fees are payable at the beginning of every year. Membership fees will not be refunded.",
            helpText: "Membership Fee Consent",
          },
        ],
        displayOrder: 23,
      },

      // ==================== member-registration-phase2 Authorisation Section ====================
      {
        fieldKey: "signatoryName",
        fieldType: FormFieldType.TEXT,
        section: "consent",
        fieldsPerRow: 2,
        page: "member-registration-phase2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Signatory Name",
            label: "Signatory Name",
            placeholder: "Enter signatory name",
            helpText: "Name of the person authorized to sign",
          },
        ],
        displayOrder: 23.5,
      },
      {
        fieldKey: "signatoryPosition",
        fieldType: FormFieldType.TEXT,
        section: "consent",
        fieldsPerRow: 2,
        page: "member-registration-phase2",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Signatory Position",
            label: "Signatory Position",
            placeholder: "Enter signatory Position",
            helpText: "Position of the person authorized to sign",
          },
        ],
        displayOrder: 24.5,
      },
      {
        fieldKey: "signatureDraw",
        fieldType: FormFieldType.TEXTAREA,
        section: "signature",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Signature",
            label: "Signature",
            placeholder: "Enter signature",
            helpText: "Digital signature of the authorized person",
          },
        ],
        displayOrder: 25,
      },
      {
        fieldKey: "signatureType",
        fieldType: FormFieldType.TEXT,
        section: "signature",
        page: "member-registration-phase2",
        fieldsPerRow: 1,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Signature",
            label: "Signature",
            placeholder: "Enter signature",
            helpText: "Digital signature of the authorized person",
          },
        ],
        displayOrder: 26,
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
      `✓ Voting Member Form Fields migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing World FZO Common Member Application Form fields...");

    const fieldKeys = [
      // section titles
      "organizationInformationSectionTitle",
      "primaryContactSectionTitle",
      // organizationInformation section
      "fullLegalNameOfTheOrganization",
      "typeOfTheOrganization",
      "membershipCategory",
      "websiteUrl",
      "industries",
      "organizationContactNumber",
      // organizationInformation > address subsection
      "addressLine1",
      "addressLine2",
      "addressCity",
      "addressState",
      "addressCountry",
      "addressZip",
      // userInformation > primaryContact subsection
      "primaryContactFirstName",
      "primaryContactLastName",
      "primaryContactEmail",
      "primaryContactDesignation",
      "primaryContactNumber",
      "primaryNewsLetterSubscription",
      // consent section
      "authorizedPersonDeclaration",
      "articleOfAssociationConsent",
      "articleOfAssociationCriteriaConsent",
      "memberShipFeeConsent",
      // signature section
      "signatoryName",
      "signatureDraw",
      "signatureType",
      "signatoryPosition",
    ];

    await this.formFieldModel.deleteMany({ fieldKey: { $in: fieldKeys } });

    console.log("✓ Common Member Form Fields removed");
  }
}

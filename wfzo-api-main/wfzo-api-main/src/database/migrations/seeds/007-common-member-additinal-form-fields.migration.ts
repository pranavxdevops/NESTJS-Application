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
export class CommonMemberAdditionalFormFieldsMigration implements Migration {
  name = "007-common-member-additional-form-fields";

  constructor(private readonly formFieldModel: Model<FormField>) {}

  async up(): Promise<void> {
    console.log("Seeding World FZO Voting Member Application Form fields...");

    const formFields: Partial<FormField>[] = [
      // ==================== Phase3 SECTION: organizationInformation ====================
      {
        fieldKey: "linkedInUrl",
        fieldType: FormFieldType.URL,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "LinkedIn Profile",
            label: "LinkedIn Profile",
            placeholder: "https://www.linkedin.com/company/...",
            helpText: "Company LinkedIn profile URL",
          },
        ],
        displayOrder: 5,
      },
      {
        fieldKey: "companyName",
        fieldType: FormFieldType.TEXT,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Company Name",
            label: "Company Name",
            placeholder: "Enter company name",
            helpText: "Official company name for display",
          },
        ],
        displayOrder: 6,
      },
      {
        fieldKey: "memberVideoUrl",
        fieldType: FormFieldType.URL,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Corporate Video Link",
            label: "Corporate Video Link",
            placeholder: "https://youtube.com/watch?v=...",
            helpText: "Link to company promotional or introduction video",
          },
        ],
        displayOrder: 7,
      },
      {
        fieldKey: "memberLogoUrl",
        fieldType: FormFieldType.URL,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Member Logo URL",
            label: "Member Logo URL",
            placeholder: "https://cdn.example.com/logos/logo.png",
            helpText: "URL of the member's logo image",
          },
        ],
        displayOrder: 8,
      },
      {
        fieldKey: "organisationImageUrl",
        fieldType: FormFieldType.URL,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Organisation Image URL",
            label: "Organisation Image URL",
            placeholder: "https://cdn.example.com/images/building.jpg",
            helpText: "URL of the organisation's image",
          },
        ],
        displayOrder: 9,
      },
      {
        fieldKey: "establishedYear",
        fieldType: FormFieldType.NUMBER,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Year Established",
            label: "Year Established",
            placeholder: "e.g., 2015",
            helpText: "Year the organisation was established",
          },
        ],
        displayOrder: 11,
      },
      {
        fieldKey: "numberOfEmployees",
        fieldType: FormFieldType.NUMBER,
        section: "organizationInformation",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Number of Employees",
            label: "Number of Employees",
            placeholder: "e.g., 50",
            helpText: "Number of employees in the organisation",
          },
        ],
        displayOrder: 12,
      },

      // ==================== SUBSECTION: primaryContact ====================

      {
        fieldKey: "primaryCorrespondanceUser",
        fieldType: FormFieldType.CHECKBOX,
        section: "userInformation",
        subSection: "primaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Correspondance User",
            label: "Correspondance User",
            helpText: "User will receive correspondence",
          },
        ],
        displayOrder: 35,
      },

      // ==================== SUBSECTION: secondaryContact ====================
      {
        fieldKey: "secondaryContactFirstName",
        fieldType: FormFieldType.TEXT,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Secondary Contact First Name",
            label: "Secondary Contact First Name",
            placeholder: "Enter secondary contact person's first name",
            helpText: "Alternative contact person (optional)",
          },
        ],
        displayOrder: 40,
      },
      {
        fieldKey: "secondaryContactLastName",
        fieldType: FormFieldType.TEXT,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Secondary Contact Last Name",
            label: "Secondary Contact Last Name",
            placeholder: "Enter secondary contact person's last name",
            helpText: "Alternative contact person (optional)",
          },
        ],
        displayOrder: 41,
      },
      {
        fieldKey: "secondaryContactEmail",
        fieldType: FormFieldType.EMAIL,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Secondary Contact Email (Work Email Only)",
            label: "Secondary Contact Email (Work Email Only)",
            placeholder: "secondary@company.com",
            helpText: "Work email of secondary contact",
          },
        ],
        displayOrder: 42,
      },
      {
        fieldKey: "secondaryContactDesignation",
        fieldType: FormFieldType.TEXT,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Designation (Secondary Contact)",
            label: "Designation (Secondary Contact)",
            placeholder: "Enter job title",
            helpText: "Position of secondary contact person",
          },
        ],
        displayOrder: 43,
      },
      {
        fieldKey: "secondaryContactNumber",
        fieldType: FormFieldType.PHONE,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Contact Number (Secondary Contact)",
            label: "Contact Number (Secondary Contact)",
            placeholder: "+1 (555) 123-4567",
            helpText: "Phone number of secondary contact",
          },
        ],
        displayOrder: 44,
      },
      {
        fieldKey: "secondaryCorrespondanceUser",
        fieldType: FormFieldType.CHECKBOX,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Correspondance User",
            label: "Correspondance User",
            helpText: "User will receive correspondence",
          },
        ],
        displayOrder: 45,
      },
      {
        fieldKey: "secondaryNewsLetterSubscription",
        fieldType: FormFieldType.CHECKBOX,
        section: "userInformation",
        subSection: "secondaryContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Newsletter Subscription",
            label: "Newsletter Subscription",
            helpText: "Subscribe to World FZO newsletter",
          },
        ],
        displayOrder: 46,
      },

      // ==================== SUBSECTION: marketingContact ====================
      {
        fieldKey: "fzMarketingFocalPoint",
        fieldType: FormFieldType.TEXT,
        section: "userInformation",
        subSection: "marketingContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Contact of the Focal Points for Marketing",
            label: "Contact of the Focal Points for Marketing",
            placeholder: "Enter marketing contact name",
            helpText: "Person responsible for marketing activities",
          },
        ],
        displayOrder: 50,
      },
      {
        fieldKey: "fzMarketingEmail",
        fieldType: FormFieldType.EMAIL,
        section: "userInformation",
        subSection: "marketingContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Email for Marketing Focal Point",
            label: "Email for Marketing Focal Point",
            placeholder: "marketing@freezone.com",
            helpText: "Email of marketing focal point",
          },
        ],
        displayOrder: 51,
      },

      // ==================== SUBSECTION: investorContact ====================
      {
        fieldKey: "fzInvestorFocalPoint",
        fieldType: FormFieldType.TEXT,
        section: "userInformation",
        subSection: "investorContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Contact of the Focal Points for Investors",
            label: "Contact of the Focal Points for Investors",
            placeholder: "Enter investor relations contact name",
            helpText: "Person responsible for investor relations",
          },
        ],
        displayOrder: 55,
      },
      {
        fieldKey: "fzInvestorEmail",
        fieldType: FormFieldType.EMAIL,
        section: "userInformation",
        subSection: "investorContact",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Email for Investor Focal Point",
            label: "Email for Investor Focal Point",
            placeholder: "investors@freezone.com",
            helpText: "Email of investor focal point",
          },
        ],
        displayOrder: 56,
      },

      // ==================== SECTION: questionnaire ====================
      {
        fieldKey: "companyProfileDescription",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Write a Brief Description About Your Company (Company Profile)",
            label: "Write a Brief Description About Your Company (Company Profile)",
            placeholder:
              "Describe your company's business, services, and unique value proposition...",
            helpText: "Brief overview of your company for the World FZO directory",
          },
        ],
        displayOrder: 60,
      },
      {
        fieldKey: "whyJoinWorldFZO",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "Why Have You Chosen to Join World FZO or Write a Testimony About the Benefits You've Realised From Being a Member of World FZO",
            label:
              "Why Have You Chosen to Join World FZO or Write a Testimony About the Benefits You've Realised From Being a Member of World FZO",
            placeholder:
              "Share your reasons for joining or testimonial about membership benefits...",
            helpText: "Your motivation for joining or experience with World FZO",
          },
        ],
        displayOrder: 61,
      },
      {
        fieldKey: "fzTotalSize",
        fieldType: FormFieldType.TEXT,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Total Size of Free Zone (Surface Area)",
            label: "Total Size of Free Zone (Surface Area)",
            placeholder: "e.g., 50 sq km, 200 hectares",
            helpText: "Total surface area of the free zone",
          },
        ],
        displayOrder: 62,
      },
      {
        fieldKey: "fzFoundedYear",
        fieldType: FormFieldType.NUMBER,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "When Was Your Free Zone Founded?",
            label: "When Was Your Free Zone Founded?",
            placeholder: "e.g., 2005",
            helpText: "Year the free zone was established",
          },
        ],
        displayOrder: 63,
      },
      {
        fieldKey: "fzNumberOfCompanies",
        fieldType: FormFieldType.NUMBER,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "How Many Companies Operate in Your Free Zone?",
            label: "How Many Companies Operate in Your Free Zone?",
            placeholder: "e.g., 500",
            helpText: "Total number of companies/tenants",
          },
        ],
        displayOrder: 64,
      },
      {
        fieldKey: "fzNumberOfEmployees",
        fieldType: FormFieldType.NUMBER,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "How Many Employees Do You Have in Your Free Zone?",
            label: "How Many Employees Do You Have in Your Free Zone?",
            placeholder: "e.g., 100",
            helpText: "Number of free zone authority employees",
          },
        ],
        displayOrder: 65,
      },
      {
        fieldKey: "fzJobsCreated",
        fieldType: FormFieldType.NUMBER,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "What Is the Number of Jobs Created by Your Free Zone Through Your Tenants?",
            label: "What Is the Number of Jobs Created by Your Free Zone Through Your Tenants?",
            placeholder: "e.g., 5000",
            helpText: "Total jobs created by tenant companies",
          },
        ],
        displayOrder: 66,
      },
      {
        fieldKey: "fzServicesBenefits",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "What Are the Benefits Offered by Your Free Zone in Terms of Services?",
            label: "What Are the Benefits Offered by Your Free Zone in Terms of Services?",
            placeholder:
              "List services provided (e.g., customs clearance, logistics, IT infrastructure...)",
            helpText: "Services and facilities offered to tenants",
          },
        ],
        displayOrder: 67,
      },
      {
        fieldKey: "fzMainActivitySectors",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Which Are the Main Activity Sectors Represented in Your Free Zone?",
            label: "Which Are the Main Activity Sectors Represented in Your Free Zone?",
            placeholder: "List main sectors (e.g., logistics, manufacturing, technology...)",
            helpText: "Primary industries operating in the free zone",
          },
        ],
        displayOrder: 68,
      },
      {
        fieldKey: "fzTaxIncentives",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "What Are the Benefits Offered by Your FZ in Terms of Incentives/Tax?",
            label: "What Are the Benefits Offered by Your FZ in Terms of Incentives/Tax?",
            placeholder:
              "Describe tax benefits and incentives (e.g., 0% corporate tax, customs exemptions...)",
            helpText: "Tax incentives and financial benefits",
          },
        ],
        displayOrder: 69,
      },
      {
        fieldKey: "needsConsulting",
        fieldType: FormFieldType.RADIO,
        section: "questionnaire",
        dropdownCategory: "yesNo",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Do You Have Any Consulting Needs?",
            label: "Do You Have Any Consulting Needs?",
            helpText: "Indicate if you need consulting services",
          },
        ],
        displayOrder: 70,
      },
      {
        fieldKey: "needsConsultingAreas",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "In Which Area the Experts of the World FZO Can Assist You to Improve Your Free Zone?",
            label:
              "In Which Area the Experts of the World FZO Can Assist You to Improve Your Free Zone?",
            placeholder: "Describe areas where you need expert assistance...",
            helpText: "Specific areas where you need consulting support",
          },
        ],
        displayOrder: 71,
      },
      {
        fieldKey: "needsTraining",
        fieldType: FormFieldType.RADIO,
        section: "questionnaire",
        dropdownCategory: "yesNo",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "Do You Have Any Training Needs? Are You Interested to Develop the Capacity Building of Your FZ Staff?",
            label:
              "Do You Have Any Training Needs? Are You Interested to Develop the Capacity Building of Your FZ Staff?",
            helpText: "Indicate interest in training programs",
          },
        ],
        displayOrder: 72,
      },
      {
        fieldKey: "needsTrainingAreas",
        fieldType: FormFieldType.TEXTAREA,
        section: "questionnaire",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Which Are the Areas You Like to Have Training?",
            label: "Which Are the Areas You Like to Have Training?",
            placeholder: "List training topics of interest...",
            helpText: "Specific training areas needed",
          },
        ],
        displayOrder: 73,
      },
      {
        fieldKey: "attendConferences",
        fieldType: FormFieldType.RADIO,
        section: "questionnaire",
        dropdownCategory: "yesNo",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "Do You Want to Attend Our Free Zone Global or Regional Conferences/Seminars/Webinars?",
            label:
              "Do You Want to Attend Our Free Zone Global or Regional Conferences/Seminars/Webinars?",
            helpText: "Interest in World FZO events",
          },
        ],
        displayOrder: 74,
      },
      {
        fieldKey: "customizedEvents",
        fieldType: FormFieldType.RADIO,
        section: "questionnaire",
        dropdownCategory: "yesNo",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Do You Want Them to Be Customized for Your Specific Needs?",
            label: "Do You Want Them to Be Customized for Your Specific Needs?",
            helpText: "Interest in customized events",
          },
        ],
        displayOrder: 75,
      },
      {
        fieldKey: "recognizedFreeZone",
        fieldType: FormFieldType.RADIO,
        section: "questionnaire",
        dropdownCategory: "yesNo",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "Do You Want to Become a Global Safe, Green or Smart Zone Recognized Free Zone and Start the Process to Become One?",
            label:
              "Do You Want to Become a Global Safe, Green or Smart Zone Recognized Free Zone and Start the Process to Become One?",
            helpText: "Interest in certification programs",
          },
        ],
        displayOrder: 76,
      },

      // ==================== SECTION: newsletter ====================
      {
        fieldKey: "receiveWeeklyNewsletter",
        fieldType: FormFieldType.CHECKBOX,
        section: "newsletter",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "I Would Like to Receive World FZO Weekly Newsletter by Email",
            label: "I Would Like to Receive World FZO Weekly Newsletter by Email",
            helpText: "Subscribe to regular World FZO updates",
          },
        ],
        displayOrder: 80,
      },
      {
        fieldKey: "newsletterEmail",
        fieldType: FormFieldType.EMAIL,
        section: "newsletter",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Email 1 (Newsletter)",
            label: "Email 1 (Newsletter)",
            placeholder: "email1@company.com",
            helpText: "Primary email for newsletter delivery",
          },
        ],
        displayOrder: 81,
      },

      // ==================== SECTION: consent ====================

      {
        fieldKey: "publicationConsent",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Publication Consent",
            label: "Publication Consent",
            helpText: "I consent to publication of my information",
          },
        ],
        displayOrder: 93,
      },
      {
        fieldKey: "approvalForExposure",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value:
              "I Give World FZO Approval to Use the Following Information to Gain Exposure on World FZO Websites & Publications",
            label:
              "I Give World FZO Approval to Use the Following Information to Gain Exposure on World FZO Websites & Publications",
            helpText: "Check to allow World FZO to feature your organization",
          },
        ],
        displayOrder: 94,
      },
      {
        fieldKey: "termsAndConditions",
        fieldType: FormFieldType.CHECKBOX,
        section: "consent",
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            value: "Terms and Conditions",
            label: "Terms and Conditions",
            helpText: "I agree to the World FZO terms and conditions",
          },
        ],
        displayOrder: 95,
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
      `✓ Common Member Additional Form Fields migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing World FZO Common Member Additional Form fields...");

    const fieldKeys = [
      // organizationInformation section
      "linkedInUrl",
      "companyName",
      "memberVideoUrl",
      "memberLogoUrl",
      "organisationImageUrl",
      "establishedYear",
      "numberOfEmployees",
      // userInformation > primaryContact subsection
      "primaryCorrespondanceUser",
      // userInformation > secondaryContact subsection
      "secondaryContactFirstName",
      "secondaryContactLastName",
      "secondaryContactEmail",
      "secondaryContactDesignation",
      "secondaryContactNumber",
      "secondaryCorrespondanceUser",
      "secondaryNewsLetterSubscription",
      // userInformation > marketingContact subsection
      "fzMarketingFocalPoint",
      "fzMarketingEmail",
      // userInformation > investorContact subsection
      "fzInvestorFocalPoint",
      "fzInvestorEmail",
      // questionnaire section
      "companyProfileDescription",
      "whyJoinWorldFZO",
      "fzTotalSize",
      "fzFoundedYear",
      "fzNumberOfCompanies",
      "fzNumberOfEmployees",
      "fzJobsCreated",
      "fzServicesBenefits",
      "fzMainActivitySectors",
      "fzTaxIncentives",
      "needsConsulting",
      "needsConsultingAreas",
      "needsTraining",
      "needsTrainingAreas",
      "attendConferences",
      "customizedEvents",
      "recognizedFreeZone",
      // newsletter section
      "receiveWeeklyNewsletter",
      "newsletterEmail",
      // consent section
      "publicationConsent",
      "approvalForExposure",
      "termsAndConditions",
    ];

    await this.formFieldModel.deleteMany({ fieldKey: { $in: fieldKeys } });

    console.log("✓ Common Member Additional Form Fields removed");
  }
}

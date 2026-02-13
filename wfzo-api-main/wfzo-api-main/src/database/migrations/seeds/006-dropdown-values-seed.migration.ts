import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { DropdownValue } from "../../../modules/masterdata/schemas/dropdown-value.schema";
import { SupportedLanguage } from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Seed dropdown values for enums
 *
 * Populates dropdownValues collection with all enum values used in the application:
 * - MembershipCategory
 * - Industries
 * - Tier
 * - MemberStatus
 * - UserType
 * - UserStatus
 * - AccessLevel
 * - DiscountType
 * - EventType
 * - QuotaWindow
 * - PlatformFeature (21 features)
 */
export class DropdownValuesSeedMigration implements Migration {
  name = "006-dropdown-values-seed";

  constructor(private readonly dropdownValueModel: Model<DropdownValue>) {}

  async up(): Promise<void> {
    console.log("Seeding dropdown values...");

    const dropdownValues: Partial<DropdownValue>[] = [
      // MembershipCategory - Active categories
      {
        category: "membershipCategory",
        code: "votingMember",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Voting Member" }],
        displayOrder: 1,
        deletedAt: null,
      },
      {
        category: "membershipCategory",
        code: "associateMember",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Associate Member" }],
        displayOrder: 2,
        deletedAt: null,
      },
      {
        category: "membershipCategory",
        code: "partnerAndObserver",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Partner and Observer" }],
        displayOrder: 3,
        deletedAt: null,
      },

      // Industries
      {
        category: "industries",
        code: "manufacturing",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Manufacturing" }],
        displayOrder: 1,
      },
      {
        category: "industries",
        code: "technology",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Technology & IT Services" }],
        displayOrder: 2,
      },
      {
        category: "industries",
        code: "financialServices",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Financial Services" }],
        displayOrder: 3,
      },
      {
        category: "industries",
        code: "healthcare",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Healthcare & Pharmaceuticals" },
        ],
        displayOrder: 4,
      },
      {
        category: "industries",
        code: "retail",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Retail & E-commerce" }],
        displayOrder: 5,
      },
      {
        category: "industries",
        code: "logistics",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Logistics & Supply Chain" }],
        displayOrder: 6,
      },
      {
        category: "industries",
        code: "realEstate",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Real Estate & Construction" },
        ],
        displayOrder: 7,
      },
      {
        category: "industries",
        code: "energy",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Energy & Utilities" }],
        displayOrder: 8,
      },
      {
        category: "industries",
        code: "telecommunications",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Telecommunications" }],
        displayOrder: 9,
      },
      {
        category: "industries",
        code: "media",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Media & Entertainment" }],
        displayOrder: 10,
      },
      {
        category: "industries",
        code: "education",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Education & Training" }],
        displayOrder: 11,
      },
      {
        category: "industries",
        code: "hospitalityTourism",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Hospitality & Tourism" }],
        displayOrder: 12,
      },
      {
        category: "industries",
        code: "agriculture",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Agriculture & Food Production" },
        ],
        displayOrder: 13,
      },
      {
        category: "industries",
        code: "transportation",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Transportation & Aviation" }],
        displayOrder: 14,
      },
      {
        category: "industries",
        code: "consulting",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Consulting & Professional Services" },
        ],
        displayOrder: 15,
      },
      {
        category: "industries",
        code: "automotive",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Automotive" }],
        displayOrder: 16,
      },
      {
        category: "industries",
        code: "chemicals",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Chemicals & Materials" }],
        displayOrder: 17,
      },
      {
        category: "industries",
        code: "environmental",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Environmental Services" }],
        displayOrder: 18,
      },
      {
        category: "industries",
        code: "maritime",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Maritime & Shipping" }],
        displayOrder: 19,
      },
      {
        category: "industries",
        code: "aerospace",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Aerospace & Defense" }],
        displayOrder: 20,
      },
      {
        category: "industries",
        code: "other",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Other" }],
        displayOrder: 21,
      },

      // Tier
      {
        category: "tier",
        code: "basic",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Basic" }],
        displayOrder: 1,
      },
      {
        category: "tier",
        code: "core",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Core" }],
        displayOrder: 2,
      },
      {
        category: "tier",
        code: "premium",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Premium" }],
        displayOrder: 3,
      },

      // MemberStatus
      {
        category: "memberStatus",
        code: "active",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Active" }],
        displayOrder: 1,
      },
      {
        category: "memberStatus",
        code: "expired",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Expired" }],
        displayOrder: 2,
      },
      {
        category: "memberStatus",
        code: "pendingApproval",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Pending Approval" }],
        displayOrder: 3,
      },
      {
        category: "memberStatus",
        code: "pendingFormSubmission",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Pending Form Submission" }],
        displayOrder: 4,
      },

      // UserType
      {
        category: "userType",
        code: "Primary",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Primary" }],
        displayOrder: 1,
      },
      {
        category: "userType",
        code: "Secondry", // Keep typo for backward compatibility
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Secondary" }],
        displayOrder: 2,
      },
      {
        category: "userType",
        code: "Non Member",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Non Member" }],
        displayOrder: 3,
      },
      {
        category: "userType",
        code: "Internal",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Internal" }],
        displayOrder: 4,
      },

      // UserStatus
      {
        category: "userStatus",
        code: "active",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Active" }],
        displayOrder: 1,
      },
      {
        category: "userStatus",
        code: "inactive",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Inactive" }],
        displayOrder: 2,
      },
      {
        category: "userStatus",
        code: "suspended",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Suspended" }],
        displayOrder: 3,
      },

      // AccessLevel
      {
        category: "accessLevel",
        code: "none",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "None" }],
        displayOrder: 1,
      },
      {
        category: "accessLevel",
        code: "restricted",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Restricted" }],
        displayOrder: 2,
      },
      {
        category: "accessLevel",
        code: "unlimited",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Unlimited" }],
        displayOrder: 3,
      },
      {
        category: "accessLevel",
        code: "payment",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Payment" }],
        displayOrder: 4,
      },
      {
        category: "accessLevel",
        code: "approval",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Approval" }],
        displayOrder: 5,
      },

      // DiscountType
      {
        category: "discountType",
        code: "percentage",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Percentage" }],
        displayOrder: 1,
      },
      {
        category: "discountType",
        code: "flat",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Flat" }],
        displayOrder: 2,
      },

      // EventType
      {
        category: "eventType",
        code: "webinar",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Webinar" }],
        displayOrder: 1,
      },
      {
        category: "eventType",
        code: "meeting",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Meeting" }],
        displayOrder: 2,
      },

      // QuotaWindow
      {
        category: "quotaWindow",
        code: "daily",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Daily" }],
        displayOrder: 1,
      },
      {
        category: "quotaWindow",
        code: "weekly",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Weekly" }],
        displayOrder: 2,
      },
      {
        category: "quotaWindow",
        code: "monthly",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Monthly" }],
        displayOrder: 3,
      },
      {
        category: "quotaWindow",
        code: "yearly",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Yearly" }],
        displayOrder: 4,
      },
      {
        category: "quotaWindow",
        code: "per-event",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Per Event" }],
        displayOrder: 5,
      },

      // Platform Features
      {
        category: "platformFeature",
        code: "generalNews",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "General News" }],
        displayOrder: 1,
      },
      {
        category: "platformFeature",
        code: "wfzoNews",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "WFZO News" }],
        displayOrder: 2,
      },
      {
        category: "platformFeature",
        code: "otherFzoNews",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Other FZO News" }],
        displayOrder: 3,
      },
      {
        category: "platformFeature",
        code: "wfzoOutlooks",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "WFZO Outlooks" }],
        displayOrder: 4,
      },
      {
        category: "platformFeature",
        code: "otherFzoReports",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Other FZO Reports" }],
        displayOrder: 5,
      },
      {
        category: "platformFeature",
        code: "library",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Library" }],
        displayOrder: 6,
      },
      {
        category: "platformFeature",
        code: "onlineWfzoZoomEvents",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Online WFZO Zoom Events" }],
        displayOrder: 7,
      },
      {
        category: "platformFeature",
        code: "wfzoWebinars",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "WFZO Webinars" }],
        displayOrder: 8,
      },
      {
        category: "platformFeature",
        code: "onlineOtherFzoEvents",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Online Other FZO Events" }],
        displayOrder: 9,
      },
      {
        category: "platformFeature",
        code: "otherFzoWebinars",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Other FZO Webinars" }],
        displayOrder: 10,
      },
      {
        category: "platformFeature",
        code: "wfzoInPersonEvents",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "WFZO In Person Events" }],
        displayOrder: 11,
      },
      {
        category: "platformFeature",
        code: "otherFzoInPersonEvents",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Other FZO In Person Events" },
        ],
        displayOrder: 12,
      },
      {
        category: "platformFeature",
        code: "pastEventRecordings",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Past Event Recordings (Online/Offline)" },
        ],
        displayOrder: 13,
      },
      {
        category: "platformFeature",
        code: "featuredMemberView",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Featured Member View" }],
        displayOrder: 14,
      },
      {
        category: "platformFeature",
        code: "memberProfileView",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Member Profile View" }],
        displayOrder: 15,
      },
      {
        category: "platformFeature",
        code: "atlasView",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Atlas View" }],
        displayOrder: 16,
      },
      {
        category: "platformFeature",
        code: "learnings",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Learnings" }],
        displayOrder: 17,
      },
      {
        category: "platformFeature",
        code: "memberToMemberConnect",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Member to Member Connect" }],
        displayOrder: 18,
      },
      {
        category: "platformFeature",
        code: "forumDiscussion",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Forum Discussion" }],
        displayOrder: 19,
      },
      {
        category: "platformFeature",
        code: "votingRights",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Voting Rights" }],
        displayOrder: 20,
      },
      {
        category: "platformFeature",
        code: "boardEligibility",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Board Eligibility" }],
        displayOrder: 21,
      },
    ];

    // Use bulkWrite for efficient upsert operations
    const bulkOps = dropdownValues.map((value) => ({
      updateOne: {
        filter: { category: value.category, code: value.code },
        update: { $set: value },
        upsert: true,
      },
    }));

    const result = await this.dropdownValueModel.bulkWrite(bulkOps);

    console.log(
      `✓ Dropdown values migration completed - Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing seeded dropdown values...");

    const categories = [
      "membershipCategory",
      "industries",
      "tier",
      "memberStatus",
      "userType",
      "userStatus",
      "accessLevel",
      "discountType",
      "eventType",
      "quotaWindow",
      "platformFeature",
    ];

    const result = await this.dropdownValueModel.deleteMany({
      category: { $in: categories },
    });

    console.log(`✓ Dropdown values rollback completed - Deleted: ${result.deletedCount} records`);
  }
}

import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { DropdownValue } from "../../../modules/masterdata/schemas/dropdown-value.schema";
import { SupportedLanguage } from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Seed dropdown values for World FZO Voting Member Application Form
 *
 * Adds dropdown values for:
 * - Organization Type
 * - Membership Level (specific to voting members)
 * - Yes/No options (for radio buttons)
 */
export class VotingFormDropdownValuesMigration implements Migration {
  name = "008-voting-form-dropdown-values";

  constructor(private readonly dropdownValueModel: Model<DropdownValue>) {}

  async up(): Promise<void> {
    console.log("Seeding dropdown values for Voting Member Application Form...");

    const dropdownValues: Partial<DropdownValue>[] = [
      // Organization Type (normalized - consolidated Free Zone variations)
      {
        category: "organizationType",
        code: "freeZone",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Free Zone" }],
        displayOrder: 1,
      },
      {
        category: "organizationType",
        code: "specialEconomicZone",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Special Economic Zone (SEZ)" },
        ],
        displayOrder: 2,
      },
      {
        category: "organizationType",
        code: "exportProcessingZone",
        page: "member-registration-phase1",
        translations: [
          { language: SupportedLanguage.ENGLISH, value: "Export Processing Zone (EPZ)" },
        ],
        displayOrder: 3,
      },
      {
        category: "organizationType",
        code: "freeTradeZone",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Free Trade Zone (FTZ)" }],
        displayOrder: 4,
      },
      {
        category: "organizationType",
        code: "governmentEntity",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Government Entity" }],
        displayOrder: 5,
      },
      {
        category: "organizationType",
        code: "portAuthority",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Port Authority" }],
        displayOrder: 6,
      },
      {
        category: "organizationType",
        code: "industrialPark",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Industrial Park" }],
        displayOrder: 7,
      },
      {
        category: "organizationType",
        code: "technologyPark",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Technology Park" }],
        displayOrder: 8,
      },
      {
        category: "organizationType",
        code: "other",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Other" }],
        displayOrder: 9,
      },

      // Yes/No options (for radio buttons)
      {
        category: "yesNo",
        code: "yes",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "Yes" }],
        displayOrder: 1,
      },
      {
        category: "yesNo",
        code: "no",
        page: "member-registration-phase1",
        translations: [{ language: SupportedLanguage.ENGLISH, value: "No" }],
        displayOrder: 2,
      },
    ];

    let insertedCount = 0;
    let modifiedCount = 0;

    for (const value of dropdownValues) {
      const result = await this.dropdownValueModel.updateOne(
        { category: value.category, code: value.code },
        { $set: value },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
      } else if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    console.log(
      `✓ Voting Form Dropdown Values migration completed - Inserted: ${insertedCount}, Modified: ${modifiedCount}`,
    );
  }

  async down(): Promise<void> {
    console.log("Removing Voting Form dropdown values...");

    await this.dropdownValueModel.deleteMany({
      $or: [
        { category: "organizationType" },
        { category: "membershipLevel" },
        { category: "yesNo" },
      ],
    });

    console.log("✓ Voting Form dropdown values removed");
  }
}

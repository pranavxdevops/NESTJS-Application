import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import {
  FormField,
  SupportedLanguage,
} from "../../../modules/masterdata/schemas/form-field.schema";

/**
 * Migration: Update signatoryPosition field translation
 *
 * Updates the value and label for the signatoryPosition field from "Signatory Name" to "Signatory Position"
 * for the English translation.
 */
export class UpdateSignatoryPositionFieldTranslationMigration implements Migration {
  name = "029-update-signatory-position-field-translation";

  constructor(private readonly formFieldModel: Model<FormField>) {}

  async up(): Promise<void> {
    console.log("Updating signatoryPosition field translation...");

    const result = await this.formFieldModel.updateOne(
      {
        fieldKey: "signatoryPosition",
        "translations.language": SupportedLanguage.ENGLISH
      },
      {
        $set: {
          "translations.$.value": "Signatory Position",
          "translations.$.label": "Signatory Position"
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Updated signatoryPosition field translation");
    } else {
      console.log("⚠ No signatoryPosition field found to update");
    }
  }

  async down(): Promise<void> {
    console.log("Reverting signatoryPosition field translation...");

    const result = await this.formFieldModel.updateOne(
      {
        fieldKey: "signatoryPosition",
        "translations.language": SupportedLanguage.ENGLISH
      },
      {
        $set: {
          "translations.$.value": "Signatory Name",
          "translations.$.label": "Signatory Name"
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✓ Reverted signatoryPosition field translation");
    } else {
      console.log("⚠ No signatoryPosition field found to revert");
    }
  }
}
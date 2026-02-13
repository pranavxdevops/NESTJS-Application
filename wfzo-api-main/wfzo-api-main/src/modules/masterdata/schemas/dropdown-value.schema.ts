import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Translation, TranslationSchema } from "./form-field.schema";

/**
 * Dropdown value with multi-language support
 * Used for dropdowns, radio buttons, and other selection components
 */
@Schema({
  collection: "dropdownValues",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class DropdownValue {
  @Prop({ required: true, index: true })
  category!: string; // Category/group (e.g., "countries", "membershipCategories", "queryTypes")

  @Prop({ required: true })
  code!: string; // Unique code within category (e.g., "IN", "zoneMember")

  @Prop({ required: true })
  page!: string; // Unique code within category (e.g., "IN", "zoneMember")

  @Prop({ type: [TranslationSchema], required: true })
  translations!: Translation[]; // Multi-language values

  @Prop({ default: 0 })
  displayOrder!: number; // Order in which option appears

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // Soft delete timestamp
}

export type DropdownValueDocument = DropdownValue & Document;
export const DropdownValueSchema = SchemaFactory.createForClass(DropdownValue);

// Compound index for efficient category + code lookups
DropdownValueSchema.index({ category: 1, code: 1 }, { unique: true });
DropdownValueSchema.index({ category: 1, displayOrder: 1 });

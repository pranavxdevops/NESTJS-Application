import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Supported languages for multi-language translations
 */
export enum SupportedLanguage {
  ENGLISH = "en",
  SPANISH = "es",
  FRENCH = "fr",
  MANDARIN = "zh",
}

/**
 * Form field types for dynamic form generation
 */
export enum FormFieldType {
  TEXT = "text",
  TEXTAREA = "textarea",
  EMAIL = "email",
  NUMBER = "number",
  DATE = "date",
  DROPDOWN = "dropdown",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  FILE = "file",
  PHONE = "phone",
  URL = "url",
  BUTTON = "button",
}

/**
 * Translation for a specific language
 */
@Schema({ _id: false })
export class Translation {
  @Prop({ required: true, enum: SupportedLanguage })
  language!: SupportedLanguage;

  @Prop({ required: true })
  value!: string; // For dropdown values

  @Prop()
  label?: string; // For form fields

  @Prop()
  placeholder?: string;

  @Prop()
  helpText?: string;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);

/**
 * Simple form field definition with multi-language support
 * Backend does not handle validation - that's frontend responsibility
 */
@Schema({
  collection: "formFields",
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class FormField {
  @Prop({ required: true, unique: true, index: true })
  fieldKey!: string; // Unique identifier (e.g., "firstName", "companyName")

  @Prop({ required: true, enum: FormFieldType })
  fieldType!: FormFieldType;

  @Prop({ required: true })
  page!: string;

  @Prop({ type: [TranslationSchema], required: true })
  translations!: Translation[]; // Multi-language labels, placeholders, etc.

  @Prop()
  dropdownCategory?: string; // Category of dropdown values (if fieldType is dropdown/radio)

  @Prop()
  section?: string; // Form section this field belongs to (e.g., "basicInformation", "primaryContact")

  @Prop()
  subSection?: string; // Form sub-section this field belongs to (e.g., "primaryContact", "secondaryContact")

  @Prop({ default: 0 })
  displayOrder!: number; // Order in which field appears in forms

  @Prop({ default: 1 })
  fieldsPerRow?: number; // Number of fields per row in the UI (1 = full width, 2 = half width)

  @Prop({ default: "common" })
  membershipType?: string; // Which membership category this field applies to: "common", "votingMember", "associateMember", etc.

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // Soft delete timestamp
}

export type FormFieldDocument = FormField & Document;
export const FormFieldSchema = SchemaFactory.createForClass(FormField);

// Indexes for efficient querying
FormFieldSchema.index({ fieldKey: 1 });
FormFieldSchema.index({ fieldType: 1 });
FormFieldSchema.index({ membershipType: 1 });

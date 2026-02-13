import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SupportedLanguage, FormFieldType } from "../schemas/form-field.schema";

/**
 * Translation for a single language
 */
export class TranslationDto {
  @ApiProperty({
    enum: ["en", "es", "fr", "zh"],
    description: "Language code",
    example: "en",
  })
  language!: SupportedLanguage;

  @ApiProperty({
    description: "Translated label/text",
    example: "First Name",
  })
  label!: string;

  @ApiPropertyOptional({
    description: "Translated placeholder text",
    example: "Enter your first name",
  })
  placeholder?: string;

  @ApiPropertyOptional({
    description: "Translated help text",
    example: "Please provide your legal first name",
  })
  helpText?: string;
}

/**
 * Form field with translations
 */
export class FormFieldDto {
  @ApiProperty({
    description: "Unique field identifier",
    example: "firstName",
  })
  fieldKey!: string;

  @ApiProperty({
    enum: [
      "text",
      "email",
      "tel",
      "number",
      "dropdown",
      "radio",
      "checkbox",
      "textarea",
      "date",
      "file",
    ],
    description: "Field input type",
    example: "text",
  })
  fieldType!: FormFieldType;

  @ApiPropertyOptional({
    description: "Section name (e.g., organizationInformation, contactDetails)",
    example: "organizationInformation",
  })
  section?: string;

  @ApiPropertyOptional({
    description: "Sub-section name for grouping fields within a section",
    example: "primaryContact",
  })
  subSection?: string;

  @ApiProperty({
    type: [TranslationDto],
    description: "Translations for all supported languages",
  })
  translations!: TranslationDto[];

  @ApiPropertyOptional({
    description: "Dropdown category (if fieldType is dropdown/radio)",
    example: "countries",
  })
  dropdownCategory?: string;

  @ApiProperty({
    description: "Display order",
    example: 1,
  })
  displayOrder!: number;
}

/**
 * Response for form fields by page
 */
export class FormFieldsByPageResponse {
  @ApiProperty({
    description: "Page identifier",
    example: "member-registration",
  })
  page!: string;

  @ApiProperty({
    description: "Requested language",
    example: "en",
  })
  locale!: string;

  @ApiProperty({
    type: [FormFieldDto],
    description: "Form fields with localized translations",
  })
  formFields!: FormFieldDto[];
}

/**
 * Dropdown value with code and translation
 */
export class DropdownValueDto {
  @ApiProperty({
    description: "Category/group identifier",
    example: "countries",
  })
  category!: string;

  @ApiProperty({
    description: "Unique code within category",
    example: "IN",
  })
  code!: string;

  @ApiProperty({
    description: "Localized label for the selected language",
    example: "India",
  })
  label!: string;

  @ApiProperty({
    description: "Display order",
    example: 1,
  })
  displayOrder!: number;
}

/**
 * Response for dropdowns by page
 */
export class DropdownsByPageResponse {
  @ApiProperty({
    description: "Page identifier",
    example: "member-registration",
  })
  page!: string;

  @ApiProperty({
    description: "Requested language",
    example: "en",
  })
  locale!: string;

  @ApiProperty({
    type: [DropdownValueDto],
    description: "Dropdown values with codes and localized labels",
  })
  dropdowns!: DropdownValueDto[];
}

/**
 * Response for dropdowns by category
 */
export class DropdownsByCategoryResponse {
  @ApiProperty({
    description: "Category identifier",
    example: "membershipCategory",
  })
  category!: string;

  @ApiProperty({
    description: "Requested language",
    example: "en",
  })
  locale!: string;

  @ApiProperty({
    type: [DropdownValueDto],
    description: "Dropdown values with codes and localized labels for the category",
  })
  values!: DropdownValueDto[];
}

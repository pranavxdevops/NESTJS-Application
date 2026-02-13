import { Injectable, NotFoundException } from "@nestjs/common";
import { SupportedLanguage } from "./schemas/form-field.schema";
import { FormFieldRepository } from "./repository/form-field.repository";
import { DropdownValueRepository } from "./repository/dropdown-value.repository";
import {
  FormFieldsByPageResponse,
  DropdownsByPageResponse,
  DropdownsByCategoryResponse,
  FormFieldDto,
  DropdownValueDto,
  TranslationDto,
} from "./dto/masterdata.dto";

/**
 * Simplified Master Data Service
 * Provides read-only access to form fields and dropdown values by page
 */
@Injectable()
export class MasterdataService {
  constructor(
    private readonly formFieldRepo: FormFieldRepository,
    private readonly dropdownValueRepo: DropdownValueRepository,
  ) {}

  /**
   * Get form fields for a page with localized translations
   * @param page - Page identifier (e.g., "member-registration-phase1", "contact-us")
   * @param locale - Language code (default: "en")
   * @returns Form fields with translations filtered by page and locale
   */
  async getFormFieldsByPage(
    page: string,
    locale: SupportedLanguage = SupportedLanguage.ENGLISH,
  ): Promise<FormFieldsByPageResponse> {
    console.log("Fetching form fields for page:", page, "locale:", locale);

    // Query form fields directly by page (no join needed)
    const formFields = await this.formFieldRepo.findByPage(page);

    if (!formFields || formFields.length === 0) {
      throw new NotFoundException(`No form fields found for page: ${page}`);
    }

    // Map to DTOs with translations
    const formFieldDtos: FormFieldDto[] = formFields.map((field) => ({
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      section: field.section,
      subSection: field.subSection,
      fieldsPerRow: field.fieldsPerRow,
      translations: field.translations.map((t) => ({
        language: t.language,
        label: t.label,
        placeholder: t.placeholder,
        helpText: t.helpText,
      })) as TranslationDto[],
      dropdownCategory: field.dropdownCategory,
      displayOrder: field.displayOrder,
    }));

    return {
      page,
      locale,
      formFields: formFieldDtos.sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }

  /**
   * Get dropdown values for a page with localized labels
   * Extracts dropdown categories from form fields and fetches their values
   * @param page - Page identifier (e.g., "member-registration-phase1", "contact-us")
   * @param locale - Language code (default: "en")
   * @returns Dropdown values with codes and localized labels
   */
  async getDropdownsByPage(
    page: string,
    locale: SupportedLanguage = SupportedLanguage.ENGLISH,
  ): Promise<DropdownsByPageResponse> {
    console.log("Fetching dropdowns for page:", page, "locale:", locale);

    // Get form fields for the page
    const formFields = await this.formFieldRepo.findByPage(page);

    if (!formFields || formFields.length === 0) {
      throw new NotFoundException(`No form fields found for page: ${page}`);
    }

    // Extract unique dropdown categories from form fields
    const dropdownCategories = [
      ...new Set(
        formFields
          .filter((field) => field.dropdownCategory)
          .map((field) => field.dropdownCategory!),
      ),
    ];

    if (dropdownCategories.length === 0) {
      // No dropdowns on this page
      return {
        page,
        locale,
        dropdowns: [],
      };
    }

    // Get all dropdown values for the extracted categories
    const dropdownValues = await this.dropdownValueRepo.findByCategories(dropdownCategories);

    // Map to DTOs with localized labels
    const dropdownDtos: DropdownValueDto[] = dropdownValues.map((dv) => {
      // Find translation for requested locale, fallback to English
      const translation =
        dv.translations.find((t) => t.language === locale) ||
        dv.translations.find((t) => t.language === SupportedLanguage.ENGLISH);

      return {
        category: dv.category,
        code: dv.code,
        label: translation?.value || dv.code,
        displayOrder: dv.displayOrder,
      };
    });

    return {
      page,
      locale,
      dropdowns: dropdownDtos.sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }

  /**
   * Get dropdown values by category with localized labels
   * @param category - Dropdown category identifier (e.g., "membershipCategory", "countries")
   * @param locale - Language code (default: "en")
   * @returns Dropdown values for the specified category with localized labels
   */
  async getDropdownsByCategory(
    category: string,
    locale: SupportedLanguage = SupportedLanguage.ENGLISH,
  ): Promise<DropdownsByCategoryResponse> {
    console.log("Fetching dropdowns for category:", category, "locale:", locale);

    // Get dropdown values for the category
    const dropdownValues = await this.dropdownValueRepo.findByCategory(category);

    if (!dropdownValues || dropdownValues.length === 0) {
      throw new NotFoundException(`No dropdown values found for category: ${category}`);
    }

    // Map to DTOs with localized labels
    const dropdownDtos: DropdownValueDto[] = dropdownValues.map((dv) => {
      // Find translation for requested locale, fallback to English
      const translation =
        dv.translations.find((t) => t.language === locale) ||
        dv.translations.find((t) => t.language === SupportedLanguage.ENGLISH);

      return {
        category: dv.category,
        code: dv.code,
        label: translation?.value || dv.code,
        displayOrder: dv.displayOrder,
      };
    });

    return {
      category,
      locale,
      values: dropdownDtos.sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }
}

import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { MasterdataService } from "./masterdata.service";
import { ApiKeyGuard } from "../auth/guards/api-key.guard";
import { SupportedLanguage } from "./schemas/form-field.schema";
import {
  FormFieldsByPageResponse,
  DropdownsByPageResponse,
  DropdownsByCategoryResponse,
} from "./dto/masterdata.dto";

/**
 * Master Data Controller
 * Provides read-only access to form fields and dropdown values by page
 */
@ApiTags("Master Data")
@Controller("masterdata")
export class MasterdataController {
  constructor(private readonly masterdataService: MasterdataService) {}

  /**
   * Get form fields for a page with localized translations
   * Returns all form fields configured for the specified page with translations in all supported languages
   */
  @Get("form-fields/:page")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get form fields by page",
    description:
      "Retrieve all form fields configured for a specific page with multi-language support. " +
      "Returns field definitions with type, translations, and dropdown categories if applicable. " +
      "Form fields are filtered directly by page identifier.",
  })
  @ApiParam({
    name: "page",
    description:
      "Page identifier (e.g., member-registration-phase1, member-registration-phase2, contact-us)",
    example: "member-registration-phase1",
  })
  @ApiQuery({
    name: "locale",
    required: false,
    description: "Language code for translations (defaults to English)",
    enum: ["en", "es", "fr", "zh"],
    example: "en",
  })
  @ApiResponse({
    status: 200,
    description: "Form fields retrieved successfully",
    type: FormFieldsByPageResponse,
  })
  @ApiResponse({
    status: 404,
    description: "No form fields found for the specified page",
  })
  async getFormFieldsByPage(
    @Param("page") page: string,
    @Query("locale") locale?: string,
  ): Promise<FormFieldsByPageResponse> {
    const lang = (locale as SupportedLanguage) || SupportedLanguage.ENGLISH;
    return this.masterdataService.getFormFieldsByPage(page, lang);
  }

  /**
   * Get dropdown values for a page with localized labels
   * Returns all dropdown options configured for the specified page with their codes and localized labels
   */
  @Get("dropdowns/page/:page")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get dropdown values by page",
    description:
      "Retrieve all dropdown values configured for a specific page with multi-language support. " +
      "Returns dropdown options with their codes and localized labels for the requested language. " +
      "Dropdown categories are extracted from form fields on the page.",
  })
  @ApiParam({
    name: "page",
    description:
      "Page identifier (e.g., member-registration-phase1, member-registration-phase2, contact-us)",
    example: "member-registration-phase1",
  })
  @ApiQuery({
    name: "locale",
    required: false,
    description: "Language code for translations (defaults to English)",
    enum: ["en", "es", "fr", "zh"],
    example: "en",
  })
  @ApiResponse({
    status: 200,
    description: "Dropdown values retrieved successfully",
    type: DropdownsByPageResponse,
  })
  @ApiResponse({
    status: 404,
    description: "No form fields or dropdowns found for the specified page",
  })
  async getDropdownsByPage(
    @Param("page") page: string,
    @Query("locale") locale?: string,
  ): Promise<DropdownsByPageResponse> {
    const lang = (locale as SupportedLanguage) || SupportedLanguage.ENGLISH;
    return this.masterdataService.getDropdownsByPage(page, lang);
  }

  /**
   * Get dropdown values by category with localized labels
   * Returns all dropdown options for a specific category
   */
  @Get("dropdowns/category/:category")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get dropdown values by category",
    description:
      "Retrieve all dropdown values for a specific category with multi-language support. " +
      "Returns dropdown options with their codes and localized labels for the requested language. " +
      "This endpoint is independent of pages and queries directly from the dropdown values collection.",
  })
  @ApiParam({
    name: "category",
    description: "Dropdown category identifier (e.g., membershipCategory, countries, freeZoneType)",
    example: "membershipCategory",
  })
  @ApiQuery({
    name: "locale",
    required: false,
    description: "Language code for translations (defaults to English)",
    enum: ["en", "es", "fr", "zh"],
    example: "en",
  })
  @ApiResponse({
    status: 200,
    description: "Dropdown values retrieved successfully",
    type: DropdownsByCategoryResponse,
  })
  @ApiResponse({
    status: 404,
    description: "No dropdown values found for the specified category",
  })
  async getDropdownsByCategory(
    @Param("category") category: string,
    @Query("locale") locale?: string,
  ): Promise<DropdownsByCategoryResponse> {
    const lang = (locale as SupportedLanguage) || SupportedLanguage.ENGLISH;
    return this.masterdataService.getDropdownsByCategory(category, lang);
  }
}

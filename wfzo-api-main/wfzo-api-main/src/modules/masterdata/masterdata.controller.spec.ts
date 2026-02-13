import { Test, TestingModule } from "@nestjs/testing";
import { MasterdataController } from "./masterdata.controller";
import { MasterdataService } from "./masterdata.service";
import { SupportedLanguage, FormFieldType } from "./schemas/form-field.schema";
import { FormFieldsByPageResponse, DropdownsByPageResponse } from "./dto/masterdata.dto";

describe("MasterdataController", () => {
  let controller: MasterdataController;
  let service: jest.Mocked<MasterdataService>;

  // Mock responses
  const mockFormFieldsResponse: FormFieldsByPageResponse = {
    page: "member-registration",
    locale: SupportedLanguage.ENGLISH,
    formFields: [
      {
        fieldKey: "firstName",
        fieldType: FormFieldType.TEXT,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            label: "First Name",
            placeholder: "Enter your first name",
            helpText: "Please provide your legal first name",
          },
        ],
        displayOrder: 1,
      },
      {
        fieldKey: "country",
        fieldType: FormFieldType.DROPDOWN,
        translations: [
          {
            language: SupportedLanguage.ENGLISH,
            label: "Country",
            placeholder: "Select your country",
          },
        ],
        dropdownCategory: "countries",
        displayOrder: 2,
      },
    ],
  };

  const mockDropdownsResponse: DropdownsByPageResponse = {
    page: "member-registration",
    locale: SupportedLanguage.ENGLISH,
    dropdowns: [
      {
        category: "countries",
        code: "US",
        label: "United States",
        displayOrder: 1,
      },
      {
        category: "countries",
        code: "IN",
        label: "India",
        displayOrder: 2,
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      getFormFieldsByPage: jest.fn(),
      getDropdownsByPage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterdataController],
      providers: [
        {
          provide: MasterdataService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MasterdataController>(MasterdataController);
    service = module.get(MasterdataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getFormFieldsByPage", () => {
    it("should return form fields for a page with default locale", async () => {
      service.getFormFieldsByPage.mockResolvedValue(mockFormFieldsResponse);

      const result = await controller.getFormFieldsByPage("member-registration");

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.ENGLISH,
      );
      expect(result).toEqual(mockFormFieldsResponse);
      expect(result.page).toBe("member-registration");
      expect(result.locale).toBe(SupportedLanguage.ENGLISH);
      expect(result.formFields).toHaveLength(2);
    });

    it("should return form fields with specified locale (Spanish)", async () => {
      const spanishResponse = {
        ...mockFormFieldsResponse,
        locale: SupportedLanguage.SPANISH,
      };
      service.getFormFieldsByPage.mockResolvedValue(spanishResponse);

      const result = await controller.getFormFieldsByPage("member-registration", "es");

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.SPANISH,
      );
      expect(result.locale).toBe(SupportedLanguage.SPANISH);
    });

    it("should return form fields with specified locale (French)", async () => {
      const frenchResponse = {
        ...mockFormFieldsResponse,
        locale: SupportedLanguage.FRENCH,
      };
      service.getFormFieldsByPage.mockResolvedValue(frenchResponse);

      const result = await controller.getFormFieldsByPage("member-registration", "fr");

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.FRENCH,
      );
      expect(result.locale).toBe(SupportedLanguage.FRENCH);
    });

    it("should return form fields with specified locale (Mandarin)", async () => {
      const mandarinResponse = {
        ...mockFormFieldsResponse,
        locale: SupportedLanguage.MANDARIN,
      };
      service.getFormFieldsByPage.mockResolvedValue(mandarinResponse);

      const result = await controller.getFormFieldsByPage("member-registration", "zh");

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.MANDARIN,
      );
      expect(result.locale).toBe(SupportedLanguage.MANDARIN);
    });

    it("should handle different page identifiers", async () => {
      service.getFormFieldsByPage.mockResolvedValue({
        ...mockFormFieldsResponse,
        page: "contact-us",
      });

      const result = await controller.getFormFieldsByPage("contact-us");

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "contact-us",
        SupportedLanguage.ENGLISH,
      );
      expect(result.page).toBe("contact-us");
    });

    it("should pass undefined locale as default English", async () => {
      service.getFormFieldsByPage.mockResolvedValue(mockFormFieldsResponse);

      await controller.getFormFieldsByPage("member-registration", undefined);

      expect(service.getFormFieldsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.ENGLISH,
      );
    });

    it("should include form field with dropdown category", async () => {
      service.getFormFieldsByPage.mockResolvedValue(mockFormFieldsResponse);

      const result = await controller.getFormFieldsByPage("member-registration");

      const dropdownField = result.formFields.find((f) => f.fieldType === FormFieldType.DROPDOWN);
      expect(dropdownField).toBeDefined();
      expect(dropdownField?.dropdownCategory).toBe("countries");
    });

    it("should include all translation properties", async () => {
      service.getFormFieldsByPage.mockResolvedValue(mockFormFieldsResponse);

      const result = await controller.getFormFieldsByPage("member-registration");

      const translation = result.formFields[0].translations[0];
      expect(translation).toHaveProperty("language");
      expect(translation).toHaveProperty("label");
      expect(translation).toHaveProperty("placeholder");
      expect(translation).toHaveProperty("helpText");
    });
  });

  describe("getDropdownsByPage", () => {
    it("should return dropdown values for a page with default locale", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      const result = await controller.getDropdownsByPage("member-registration");

      expect(service.getDropdownsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.ENGLISH,
      );
      expect(result).toEqual(mockDropdownsResponse);
      expect(result.page).toBe("member-registration");
      expect(result.locale).toBe(SupportedLanguage.ENGLISH);
      expect(result.dropdowns).toHaveLength(2);
    });

    it("should return dropdown values with specified locale (Spanish)", async () => {
      const spanishResponse = {
        ...mockDropdownsResponse,
        locale: SupportedLanguage.SPANISH,
        dropdowns: [
          {
            category: "countries",
            code: "US",
            label: "Estados Unidos",
            displayOrder: 1,
          },
        ],
      };
      service.getDropdownsByPage.mockResolvedValue(spanishResponse);

      const result = await controller.getDropdownsByPage("member-registration", "es");

      expect(service.getDropdownsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.SPANISH,
      );
      expect(result.locale).toBe(SupportedLanguage.SPANISH);
      expect(result.dropdowns[0].label).toBe("Estados Unidos");
    });

    it("should return dropdown values with specified locale (French)", async () => {
      const frenchResponse = {
        ...mockDropdownsResponse,
        locale: SupportedLanguage.FRENCH,
        dropdowns: [
          {
            category: "countries",
            code: "US",
            label: "États-Unis",
            displayOrder: 1,
          },
        ],
      };
      service.getDropdownsByPage.mockResolvedValue(frenchResponse);

      const result = await controller.getDropdownsByPage("member-registration", "fr");

      expect(service.getDropdownsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.FRENCH,
      );
      expect(result.dropdowns[0].label).toBe("États-Unis");
    });

    it("should handle different page identifiers", async () => {
      service.getDropdownsByPage.mockResolvedValue({
        ...mockDropdownsResponse,
        page: "event-registration",
      });

      const result = await controller.getDropdownsByPage("event-registration");

      expect(service.getDropdownsByPage).toHaveBeenCalledWith(
        "event-registration",
        SupportedLanguage.ENGLISH,
      );
      expect(result.page).toBe("event-registration");
    });

    it("should pass undefined locale as default English", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      await controller.getDropdownsByPage("member-registration", undefined);

      expect(service.getDropdownsByPage).toHaveBeenCalledWith(
        "member-registration",
        SupportedLanguage.ENGLISH,
      );
    });

    it("should include code in dropdown response", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      const result = await controller.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].code).toBe("US");
      expect(result.dropdowns[1].code).toBe("IN");
    });

    it("should include category in dropdown response", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      const result = await controller.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].category).toBe("countries");
      expect(result.dropdowns[1].category).toBe("countries");
    });

    it("should include label in dropdown response", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      const result = await controller.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].label).toBe("United States");
      expect(result.dropdowns[1].label).toBe("India");
    });

    it("should include displayOrder in dropdown response", async () => {
      service.getDropdownsByPage.mockResolvedValue(mockDropdownsResponse);

      const result = await controller.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].displayOrder).toBe(1);
      expect(result.dropdowns[1].displayOrder).toBe(2);
    });
  });
});

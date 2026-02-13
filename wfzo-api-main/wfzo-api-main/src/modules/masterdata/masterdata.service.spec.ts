import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { MasterdataService } from "./masterdata.service";
import { FormFieldRepository } from "./repository/form-field.repository";
import { DropdownValueRepository } from "./repository/dropdown-value.repository";
import { SupportedLanguage, FormFieldType } from "./schemas/form-field.schema";

describe("MasterdataService", () => {
  let service: MasterdataService;
  let formFieldRepo: jest.Mocked<FormFieldRepository>;
  let dropdownValueRepo: jest.Mocked<DropdownValueRepository>;

  // Mock data
  const mockFormFields = [
    {
      fieldKey: "firstName",
      fieldType: FormFieldType.TEXT,
      section: "personalInformation",
      subSection: "basicInfo",
      translations: [
        {
          language: SupportedLanguage.ENGLISH,
          label: "First Name",
          placeholder: "Enter your first name",
          helpText: "Please provide your legal first name",
        },
        {
          language: SupportedLanguage.SPANISH,
          label: "Nombre",
          placeholder: "Ingrese su nombre",
          helpText: "Proporcione su nombre legal",
        },
      ],
      displayOrder: 1,
    },
    {
      fieldKey: "lastName",
      fieldType: FormFieldType.TEXT,
      section: "personalInformation",
      subSection: "basicInfo",
      translations: [
        {
          language: SupportedLanguage.ENGLISH,
          label: "Last Name",
          placeholder: "Enter your last name",
        },
        {
          language: SupportedLanguage.SPANISH,
          label: "Apellido",
          placeholder: "Ingrese su apellido",
        },
      ],
      displayOrder: 2,
    },
    {
      fieldKey: "country",
      fieldType: FormFieldType.DROPDOWN,
      section: "contactInformation",
      translations: [
        {
          language: SupportedLanguage.ENGLISH,
          label: "Country",
          placeholder: "Select your country",
        },
      ],
      dropdownCategory: "countries",
      displayOrder: 3,
    },
  ];

  const mockDropdownValues = [
    {
      category: "countries",
      code: "US",
      translations: [
        { language: SupportedLanguage.ENGLISH, label: "United States" },
        { language: SupportedLanguage.SPANISH, label: "Estados Unidos" },
        { language: SupportedLanguage.FRENCH, label: "États-Unis" },
      ],
      displayOrder: 1,
    },
    {
      category: "countries",
      code: "IN",
      translations: [
        { language: SupportedLanguage.ENGLISH, label: "India" },
        { language: SupportedLanguage.SPANISH, label: "India" },
        { language: SupportedLanguage.FRENCH, label: "Inde" },
      ],
      displayOrder: 2,
    },
    {
      category: "membershipCategories",
      code: "zoneMember",
      translations: [
        { language: SupportedLanguage.ENGLISH, label: "Zone Member" },
        { language: SupportedLanguage.SPANISH, label: "Miembro de Zona" },
      ],
      displayOrder: 1,
    },
  ];

  beforeEach(async () => {
    // Create mocks
    const mockFormFieldRepo = {
      findByPage: jest.fn(),
      findByFieldKeys: jest.fn(),
    };

    const mockDropdownValueRepo = {
      findByCategory: jest.fn(),
      findByCategories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterdataService,
        {
          provide: FormFieldRepository,
          useValue: mockFormFieldRepo,
        },
        {
          provide: DropdownValueRepository,
          useValue: mockDropdownValueRepo,
        },
      ],
    }).compile();

    service = module.get<MasterdataService>(MasterdataService);
    formFieldRepo = module.get(FormFieldRepository);
    dropdownValueRepo = module.get(DropdownValueRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getFormFieldsByPage", () => {
    it("should return form fields for a valid page with default locale (English)", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);

      const result = await service.getFormFieldsByPage("member-registration");

      expect(formFieldRepo.findByPage).toHaveBeenCalledWith("member-registration");
      expect(result).toEqual({
        page: "member-registration",
        locale: SupportedLanguage.ENGLISH,
        formFields: expect.arrayContaining([
          expect.objectContaining({
            fieldKey: "firstName",
            fieldType: FormFieldType.TEXT,
            section: "personalInformation",
            subSection: "basicInfo",
            displayOrder: 1,
          }),
          expect.objectContaining({
            fieldKey: "lastName",
            fieldType: FormFieldType.TEXT,
            section: "personalInformation",
            subSection: "basicInfo",
            displayOrder: 2,
          }),
          expect.objectContaining({
            fieldKey: "country",
            fieldType: FormFieldType.DROPDOWN,
            section: "contactInformation",
            dropdownCategory: "countries",
            displayOrder: 3,
          }),
        ]),
      });
      expect(result.formFields).toHaveLength(3);
      expect(result.formFields[0].translations).toHaveLength(2); // English and Spanish
    });

    it("should return form fields with Spanish locale", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);

      const result = await service.getFormFieldsByPage(
        "member-registration",
        SupportedLanguage.SPANISH,
      );

      expect(result.locale).toBe(SupportedLanguage.SPANISH);
      expect(result.formFields[0].translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            language: SupportedLanguage.SPANISH,
            label: "Nombre",
          }),
        ]),
      );
    });

    it("should sort form fields by displayOrder", async () => {
      const unorderedFields = [mockFormFields[2], mockFormFields[0], mockFormFields[1]];
      formFieldRepo.findByPage.mockResolvedValue(unorderedFields as any);

      const result = await service.getFormFieldsByPage("member-registration");

      expect(result.formFields[0].displayOrder).toBe(1);
      expect(result.formFields[1].displayOrder).toBe(2);
      expect(result.formFields[2].displayOrder).toBe(3);
    });

    it("should throw NotFoundException when no form fields found for page", async () => {
      formFieldRepo.findByPage.mockResolvedValue([]);

      await expect(service.getFormFieldsByPage("non-existent-page")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getFormFieldsByPage("non-existent-page")).rejects.toThrow(
        "No form fields found for page: non-existent-page",
      );
    });

    it("should include section and subSection in response", async () => {
      formFieldRepo.findByPage.mockResolvedValue([mockFormFields[0]] as any);

      const result = await service.getFormFieldsByPage("member-registration");

      const firstField = result.formFields[0];
      expect(firstField.section).toBe("personalInformation");
      expect(firstField.subSection).toBe("basicInfo");
    });

    it("should include all translation properties", async () => {
      formFieldRepo.findByPage.mockResolvedValue([mockFormFields[0]] as any);

      const result = await service.getFormFieldsByPage("member-registration");

      const firstField = result.formFields[0];
      expect(firstField.translations[0]).toHaveProperty("language");
      expect(firstField.translations[0]).toHaveProperty("label");
      expect(firstField.translations[0]).toHaveProperty("placeholder");
      expect(firstField.translations[0]).toHaveProperty("helpText");
    });
  });

  describe("getDropdownsByPage", () => {
    it("should return dropdown values for a valid page with default locale (English)", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      const result = await service.getDropdownsByPage("member-registration");

      expect(formFieldRepo.findByPage).toHaveBeenCalledWith("member-registration");
      expect(dropdownValueRepo.findByCategories).toHaveBeenCalledWith(["countries"]);
      expect(result).toEqual({
        page: "member-registration",
        locale: SupportedLanguage.ENGLISH,
        dropdowns: expect.arrayContaining([
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
          {
            category: "membershipCategories",
            code: "zoneMember",
            label: "Zone Member",
            displayOrder: 1,
          },
        ]),
      });
      expect(result.dropdowns).toHaveLength(3);
    });

    it("should return dropdown values with Spanish locale", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      const result = await service.getDropdownsByPage(
        "member-registration",
        SupportedLanguage.SPANISH,
      );

      expect(result.locale).toBe(SupportedLanguage.SPANISH);
      const usCountry = result.dropdowns.find((d) => d.code === "US");
      const inCountry = result.dropdowns.find((d) => d.code === "IN");
      const zoneMember = result.dropdowns.find((d) => d.code === "zoneMember");

      expect(usCountry?.label).toBe("Estados Unidos"); // Spanish translation
      expect(inCountry?.label).toBe("India"); // Same in Spanish
      expect(zoneMember?.label).toBe("Miembro de Zona"); // Spanish translation
    });

    it("should return dropdown values with French locale", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      const result = await service.getDropdownsByPage(
        "member-registration",
        SupportedLanguage.FRENCH,
      );

      expect(result.locale).toBe(SupportedLanguage.FRENCH);
      expect(result.dropdowns[0].label).toBe("États-Unis"); // French translation
    });

    it("should fallback to English when requested locale is not available", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      const result = await service.getDropdownsByPage(
        "member-registration",
        SupportedLanguage.MANDARIN,
      );

      // Should fallback to English for all values
      const usCountry = result.dropdowns.find((d) => d.code === "US");
      const inCountry = result.dropdowns.find((d) => d.code === "IN");

      expect(usCountry?.label).toBe("United States");
      expect(inCountry?.label).toBe("India");
    });

    it("should fallback to code when no translation is available", async () => {
      const dropdownWithoutTranslations = [
        {
          category: "testCategory",
          code: "TEST_CODE",
          translations: [],
          displayOrder: 1,
        },
      ];

      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(dropdownWithoutTranslations as any);

      const result = await service.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].label).toBe("TEST_CODE"); // Fallback to code
    });

    it("should sort dropdowns by displayOrder", async () => {
      const unorderedDropdowns = [
        mockDropdownValues[2],
        mockDropdownValues[0],
        mockDropdownValues[1],
      ];
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(unorderedDropdowns as any);

      const result = await service.getDropdownsByPage("member-registration");

      expect(result.dropdowns[0].displayOrder).toBe(1);
      expect(result.dropdowns[1].displayOrder).toBe(1);
      expect(result.dropdowns[2].displayOrder).toBe(2);
    });

    it("should throw NotFoundException when no form fields found for page", async () => {
      formFieldRepo.findByPage.mockResolvedValue([]);

      await expect(service.getDropdownsByPage("non-existent-page")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getDropdownsByPage("non-existent-page")).rejects.toThrow(
        "No form fields found for page: non-existent-page",
      );
    });

    it("should handle page with no dropdown fields", async () => {
      const fieldsWithoutDropdowns = [mockFormFields[0], mockFormFields[1]]; // Only text fields
      formFieldRepo.findByPage.mockResolvedValue(fieldsWithoutDropdowns as any);

      const result = await service.getDropdownsByPage("member-registration");

      expect(result.dropdowns).toHaveLength(0);
    });

    it("should extract unique dropdown categories from form fields", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      await service.getDropdownsByPage("member-registration");

      expect(dropdownValueRepo.findByCategories).toHaveBeenCalledWith(["countries"]);
    });

    it("should include category in dropdown response", async () => {
      formFieldRepo.findByPage.mockResolvedValue(mockFormFields as any);
      dropdownValueRepo.findByCategories.mockResolvedValue(mockDropdownValues as any);

      const result = await service.getDropdownsByPage("member-registration");

      result.dropdowns.forEach((dropdown) => {
        expect(dropdown).toHaveProperty("category");
        expect(dropdown).toHaveProperty("code");
        expect(dropdown).toHaveProperty("label");
        expect(dropdown).toHaveProperty("displayOrder");
      });
    });
  });

  describe("getDropdownsByCategory", () => {
    it("should return dropdown values for a category with default locale (English)", async () => {
      const countryDropdowns = mockDropdownValues.filter((d) => d.category === "countries");
      dropdownValueRepo.findByCategory.mockResolvedValue(countryDropdowns as any);

      const result = await service.getDropdownsByCategory("countries");

      expect(dropdownValueRepo.findByCategory).toHaveBeenCalledWith("countries");
      expect(result.category).toBe("countries");
      expect(result.locale).toBe(SupportedLanguage.ENGLISH);
      expect(result.values).toHaveLength(2);
      expect(result.values).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "US",
            label: "United States",
            displayOrder: 1,
          }),
          expect.objectContaining({
            code: "IN",
            label: "India",
            displayOrder: 2,
          }),
        ]),
      );
    });

    it("should return dropdown values with Spanish locale", async () => {
      const countryDropdowns = mockDropdownValues.filter((d) => d.category === "countries");
      dropdownValueRepo.findByCategory.mockResolvedValue(countryDropdowns as any);

      const result = await service.getDropdownsByCategory("countries", SupportedLanguage.SPANISH);

      expect(result.locale).toBe(SupportedLanguage.SPANISH);
      expect(result.values[0].label).toBe("Estados Unidos");
      expect(result.values[1].label).toBe("India");
    });

    it("should throw NotFoundException when category not found", async () => {
      dropdownValueRepo.findByCategory.mockResolvedValue([]);

      await expect(service.getDropdownsByCategory("non-existent-category")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getDropdownsByCategory("non-existent-category")).rejects.toThrow(
        "No dropdown values found for category: non-existent-category",
      );
    });

    it("should sort values by displayOrder", async () => {
      const unorderedCountries = [mockDropdownValues[1], mockDropdownValues[0]];
      dropdownValueRepo.findByCategory.mockResolvedValue(unorderedCountries as any);

      const result = await service.getDropdownsByCategory("countries");

      expect(result.values[0].displayOrder).toBe(1);
      expect(result.values[1].displayOrder).toBe(2);
    });

    it("should fallback to English when locale not available", async () => {
      const countryDropdowns = mockDropdownValues.filter((d) => d.category === "countries");
      dropdownValueRepo.findByCategory.mockResolvedValue(countryDropdowns as any);

      const result = await service.getDropdownsByCategory("countries", SupportedLanguage.MANDARIN);

      expect(result.values[0].label).toBe("United States"); // Fallback to English
    });
  });
});

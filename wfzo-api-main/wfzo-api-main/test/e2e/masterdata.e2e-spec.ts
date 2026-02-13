import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { MongooseModule } from "@nestjs/mongoose";
import { MasterdataModule } from "../../src/modules/masterdata/masterdata.module";
import { FormField } from "../../src/modules/masterdata/schemas/form-field.schema";
import { DropdownValue } from "../../src/modules/masterdata/schemas/dropdown-value.schema";
import { PageConfiguration } from "../../src/modules/masterdata/schemas/page-configuration.schema";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  SupportedLanguage,
  FormFieldType,
} from "../../src/modules/masterdata/schemas/form-field.schema";

describe("MasterData E2E", () => {
  let app: INestApplication;
  let formFieldModel: Model<FormField>;
  let dropdownValueModel: Model<DropdownValue>;
  let pageConfigModel: Model<PageConfiguration>;

  // Test MongoDB connection string (use in-memory MongoDB or test database)
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/wfzo-test";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), MasterdataModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Get model references
    formFieldModel = moduleFixture.get<Model<FormField>>(getModelToken(FormField.name));
    dropdownValueModel = moduleFixture.get<Model<DropdownValue>>(getModelToken(DropdownValue.name));
    pageConfigModel = moduleFixture.get<Model<PageConfiguration>>(
      getModelToken(PageConfiguration.name),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await formFieldModel.deleteMany({});
    await dropdownValueModel.deleteMany({});
    await pageConfigModel.deleteMany({});
  });

  describe("/masterdata/form-fields/:page (GET)", () => {
    beforeEach(async () => {
      // Seed test data
      await formFieldModel.create([
        {
          fieldKey: "firstName",
          fieldType: FormFieldType.TEXT,
          translations: [
            {
              language: SupportedLanguage.ENGLISH,
              label: "First Name",
              placeholder: "Enter your first name",
              helpText: "Your legal first name",
            },
            {
              language: SupportedLanguage.SPANISH,
              label: "Nombre",
              placeholder: "Ingrese su nombre",
              helpText: "Su nombre legal",
            },
            {
              language: SupportedLanguage.FRENCH,
              label: "Prénom",
              placeholder: "Entrez votre prénom",
            },
          ],
          displayOrder: 1,
        },
        {
          fieldKey: "lastName",
          fieldType: FormFieldType.TEXT,
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
          fieldKey: "email",
          fieldType: FormFieldType.EMAIL,
          translations: [
            {
              language: SupportedLanguage.ENGLISH,
              label: "Email Address",
              placeholder: "Enter your email",
            },
          ],
          displayOrder: 3,
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
          displayOrder: 4,
        },
      ]);

      await pageConfigModel.create({
        pageKey: "member-registration",
        pageName: "Member Registration",
        formFieldKeys: ["firstName", "lastName", "email", "country"],
        dropdownCategories: ["countries", "membershipCategories"],
        isActive: true,
      });
    });

    it("should return form fields for a valid page with default locale (English)", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("page", "member-registration");
          expect(res.body).toHaveProperty("locale", "en");
          expect(res.body).toHaveProperty("formFields");
          expect(res.body.formFields).toHaveLength(4);
          expect(res.body.formFields[0]).toMatchObject({
            fieldKey: "firstName",
            fieldType: "text",
            displayOrder: 1,
          });
          expect(res.body.formFields[0].translations).toHaveLength(3);
        });
    });

    it("should return form fields with Spanish locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration?locale=es")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("es");
          expect(res.body.formFields[0].translations).toContainEqual(
            expect.objectContaining({
              language: "es",
              label: "Nombre",
            }),
          );
        });
    });

    it("should return form fields with French locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration?locale=fr")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("fr");
          expect(res.body.formFields[0].translations).toContainEqual(
            expect.objectContaining({
              language: "fr",
              label: "Prénom",
            }),
          );
        });
    });

    it("should return form fields with Mandarin locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration?locale=zh")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("zh");
        });
    });

    it("should return form fields sorted by displayOrder", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration")
        .expect(200)
        .expect((res) => {
          const displayOrders = res.body.formFields.map((f: any) => f.displayOrder);
          expect(displayOrders).toEqual([1, 2, 3, 4]);
        });
    });

    it("should include dropdown category for dropdown fields", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration")
        .expect(200)
        .expect((res) => {
          const dropdownField = res.body.formFields.find((f: any) => f.fieldType === "dropdown");
          expect(dropdownField).toBeDefined();
          expect(dropdownField.dropdownCategory).toBe("countries");
        });
    });

    it("should return 404 for non-existent page", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/non-existent-page")
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain("Page configuration not found");
        });
    });

    it("should include all translation properties", () => {
      return request(app.getHttpServer())
        .get("/masterdata/form-fields/member-registration")
        .expect(200)
        .expect((res) => {
          const translation = res.body.formFields[0].translations[0];
          expect(translation).toHaveProperty("language");
          expect(translation).toHaveProperty("label");
          expect(translation).toHaveProperty("placeholder");
          expect(translation).toHaveProperty("helpText");
        });
    });
  });

  describe("/masterdata/dropdowns/:page (GET)", () => {
    beforeEach(async () => {
      // Seed test data
      await dropdownValueModel.create([
        {
          category: "countries",
          code: "US",
          translations: [
            { language: SupportedLanguage.ENGLISH, label: "United States" },
            { language: SupportedLanguage.SPANISH, label: "Estados Unidos" },
            { language: SupportedLanguage.FRENCH, label: "États-Unis" },
            { language: SupportedLanguage.MANDARIN, label: "美国" },
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
            { language: SupportedLanguage.MANDARIN, label: "印度" },
          ],
          displayOrder: 2,
        },
        {
          category: "countries",
          code: "GB",
          translations: [
            { language: SupportedLanguage.ENGLISH, label: "United Kingdom" },
            { language: SupportedLanguage.SPANISH, label: "Reino Unido" },
            { language: SupportedLanguage.FRENCH, label: "Royaume-Uni" },
          ],
          displayOrder: 3,
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
        {
          category: "membershipCategories",
          code: "clubMember",
          translations: [
            { language: SupportedLanguage.ENGLISH, label: "Club Member" },
            { language: SupportedLanguage.SPANISH, label: "Miembro del Club" },
          ],
          displayOrder: 2,
        },
      ]);

      await pageConfigModel.create({
        pageKey: "member-registration",
        pageName: "Member Registration",
        formFieldKeys: ["firstName", "lastName"],
        dropdownCategories: ["countries", "membershipCategories"],
        isActive: true,
      });
    });

    it("should return dropdown values for a valid page with default locale (English)", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("page", "member-registration");
          expect(res.body).toHaveProperty("locale", "en");
          expect(res.body).toHaveProperty("dropdowns");
          expect(res.body.dropdowns).toHaveLength(5);
          expect(res.body.dropdowns[0]).toMatchObject({
            category: "countries",
            code: "US",
            label: "United States",
            displayOrder: 1,
          });
        });
    });

    it("should return dropdown values with Spanish locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration?locale=es")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("es");
          const usCountry = res.body.dropdowns.find((d: any) => d.code === "US");
          expect(usCountry.label).toBe("Estados Unidos");
          const zoneMember = res.body.dropdowns.find((d: any) => d.code === "zoneMember");
          expect(zoneMember.label).toBe("Miembro de Zona");
        });
    });

    it("should return dropdown values with French locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration?locale=fr")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("fr");
          const usCountry = res.body.dropdowns.find((d: any) => d.code === "US");
          expect(usCountry.label).toBe("États-Unis");
          const inCountry = res.body.dropdowns.find((d: any) => d.code === "IN");
          expect(inCountry.label).toBe("Inde");
        });
    });

    it("should return dropdown values with Mandarin locale", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration?locale=zh")
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe("zh");
          const usCountry = res.body.dropdowns.find((d: any) => d.code === "US");
          expect(usCountry.label).toBe("美国");
          const inCountry = res.body.dropdowns.find((d: any) => d.code === "IN");
          expect(inCountry.label).toBe("印度");
        });
    });

    it("should fallback to English when requested locale is not available", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration?locale=zh")
        .expect(200)
        .expect((res) => {
          const gbCountry = res.body.dropdowns.find((d: any) => d.code === "GB");
          expect(gbCountry.label).toBe("United Kingdom"); // Fallback to English
        });
    });

    it("should return dropdowns sorted by displayOrder", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          const countries = res.body.dropdowns.filter((d: any) => d.category === "countries");
          expect(countries[0].code).toBe("US");
          expect(countries[1].code).toBe("IN");
          expect(countries[2].code).toBe("GB");
        });
    });

    it("should include code in dropdown response", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          res.body.dropdowns.forEach((dropdown: any) => {
            expect(dropdown).toHaveProperty("code");
            expect(typeof dropdown.code).toBe("string");
          });
        });
    });

    it("should include category in dropdown response", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          res.body.dropdowns.forEach((dropdown: any) => {
            expect(dropdown).toHaveProperty("category");
            expect(["countries", "membershipCategories"]).toContain(dropdown.category);
          });
        });
    });

    it("should include label in dropdown response", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          res.body.dropdowns.forEach((dropdown: any) => {
            expect(dropdown).toHaveProperty("label");
            expect(typeof dropdown.label).toBe("string");
            expect(dropdown.label.length).toBeGreaterThan(0);
          });
        });
    });

    it("should include displayOrder in dropdown response", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          res.body.dropdowns.forEach((dropdown: any) => {
            expect(dropdown).toHaveProperty("displayOrder");
            expect(typeof dropdown.displayOrder).toBe("number");
          });
        });
    });

    it("should return 404 for non-existent page", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/non-existent-page")
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain("Page configuration not found");
        });
    });

    it("should handle multiple categories correctly", () => {
      return request(app.getHttpServer())
        .get("/masterdata/dropdowns/member-registration")
        .expect(200)
        .expect((res) => {
          const categories = [...new Set(res.body.dropdowns.map((d: any) => d.category))];
          expect(categories).toHaveLength(2);
          expect(categories).toContain("countries");
          expect(categories).toContain("membershipCategories");
        });
    });
  });

  describe("Integration - Form Fields and Dropdowns", () => {
    beforeEach(async () => {
      // Seed comprehensive test data
      await formFieldModel.create([
        {
          fieldKey: "firstName",
          fieldType: FormFieldType.TEXT,
          translations: [{ language: SupportedLanguage.ENGLISH, label: "First Name" }],
          displayOrder: 1,
        },
        {
          fieldKey: "country",
          fieldType: FormFieldType.DROPDOWN,
          translations: [{ language: SupportedLanguage.ENGLISH, label: "Country" }],
          dropdownCategory: "countries",
          displayOrder: 2,
        },
        {
          fieldKey: "membershipType",
          fieldType: FormFieldType.RADIO,
          translations: [{ language: SupportedLanguage.ENGLISH, label: "Membership Type" }],
          dropdownCategory: "membershipCategories",
          displayOrder: 3,
        },
      ]);

      await dropdownValueModel.create([
        {
          category: "countries",
          code: "US",
          translations: [{ language: SupportedLanguage.ENGLISH, label: "United States" }],
          displayOrder: 1,
        },
        {
          category: "membershipCategories",
          code: "zone",
          translations: [{ language: SupportedLanguage.ENGLISH, label: "Zone Member" }],
          displayOrder: 1,
        },
      ]);

      await pageConfigModel.create({
        pageKey: "test-page",
        pageName: "Test Page",
        formFieldKeys: ["firstName", "country", "membershipType"],
        dropdownCategories: ["countries", "membershipCategories"],
        isActive: true,
      });
    });

    it("should have matching dropdown categories between form fields and dropdowns", async () => {
      const formFieldsRes = await request(app.getHttpServer())
        .get("/masterdata/form-fields/test-page")
        .expect(200);

      const dropdownsRes = await request(app.getHttpServer())
        .get("/masterdata/dropdowns/test-page")
        .expect(200);

      const dropdownFields = formFieldsRes.body.formFields.filter((f: any) => f.dropdownCategory);
      const dropdownCategories = dropdownFields.map((f: any) => f.dropdownCategory);
      const availableCategories = [
        ...new Set(dropdownsRes.body.dropdowns.map((d: any) => d.category)),
      ];

      dropdownCategories.forEach((category: string) => {
        expect(availableCategories).toContain(category);
      });
    });
  });
});

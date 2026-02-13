import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App as SupertestApp } from "supertest/types";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";
import { EmailTemplateCode } from "../../src/shared/email/schemas/email-template.schema";

/**
 * Email Service E2E Test
 * Tests sending templated emails using Azure Communication Services
 */
describe("Email Service (e2e)", () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  const http = () => app.getHttpServer() as unknown as SupertestApp;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    // Set Azure Communication Services credentials (if available)
    // If not set, the test will skip sending actual emails
    if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
      console.log(
        "⚠️  AZURE_COMMUNICATION_CONNECTION_STRING not set. Email sending will be skipped.",
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);
    await app.init();

    // Wait for migrations to complete (including email template seeding)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe("POST /wfzo/api/v1/email/send", () => {
    it("should send a welcome email to test recipient", async () => {
      // Skip if Azure credentials are not configured
      if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
        console.log("⏭️  Skipping email send test - no Azure credentials");
        return;
      }

      const emailPayload = {
        to: "arun.kv@digitalworks.co", // Single email string, not array
        templateCode: EmailTemplateCode.WELCOME_EMAIL,
        language: "en",
        params: {
          organizationName: "Digital Works Test Organization",
          memberId: "MEMBER-TEST-001",
          membershipType: "Voting Member",
          validUntil: "2026-11-07",
          profileUrl: "https://portal.wfzo.org/profile",
          eventsUrl: "https://portal.wfzo.org/events",
          networkUrl: "https://portal.wfzo.org/network",
          resourcesUrl: "https://portal.wfzo.org/resources",
          supportEmail: "support@wfzo.org",
        },
      };

      const response = await request(http())
        .post("/wfzo/api/v1/email/send")
        .send(emailPayload)
        .expect(200); // Changed from 201 to 200

      expect(response.body).toBeDefined();
      console.log("✅ Email sent successfully to arun.kv@digitalworks.co");
      console.log("Response:", response.body);
    }, 15000); // Timeout of 15 seconds for Azure email sending

    it("should fail when sending with invalid email format", async () => {
      const emailPayload = {
        to: "invalid-email", // Invalid email format
        templateCode: EmailTemplateCode.WELCOME_EMAIL,
        language: "en",
        params: {
          organizationName: "Test Org",
        },
      };

      const response = await request(http())
        .post("/wfzo/api/v1/email/send")
        .send(emailPayload)
        .expect(400);

      const body = response.body as { message?: string };
      expect(body.message).toBeDefined();
      if (body.message) {
        expect(body.message).toContain("email");
      }
    });
  });

  describe("POST /wfzo/api/v1/email/templates/:code/preview", () => {
    it("should preview MEMBER_APPROVED template", async () => {
      const previewPayload = {
        language: "en",
        params: {
          organizationName: "Test Organization",
          membershipType: "Voting Member",
          memberId: "MEMBER-001",
          approvalDate: "2025-11-07",
          approvedBy: "Admin Team",
          validUntil: "2026-11-07",
        },
      };

      const response = await request(http())
        .post(`/wfzo/api/v1/email/templates/${EmailTemplateCode.MEMBER_APPROVED}/preview`)
        .send(previewPayload)
        .expect(201);

      const body = response.body as { subject?: string; htmlBody?: string };
      expect(body).toHaveProperty("subject");
      expect(body).toHaveProperty("htmlBody");
      if (body.subject) {
        expect(body.subject).toContain("Approved");
      }
      if (body.htmlBody) {
        expect(body.htmlBody).toContain("Test Organization");
        expect(body.htmlBody).toContain("MEMBER-001");
      }
    });
  });

  describe("GET /wfzo/api/v1/email/templates", () => {
    it("should list all email templates", async () => {
      const response = await request(http()).get("/wfzo/api/v1/email/templates").expect(200);

      const body = response.body as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Check if seeded templates exist
      const templateCodes = body.map((t) => (t as { templateCode: string }).templateCode);
      expect(templateCodes).toContain(EmailTemplateCode.WELCOME_EMAIL);
      expect(templateCodes).toContain(EmailTemplateCode.MEMBER_APPROVED);
      expect(templateCodes).toContain(EmailTemplateCode.PASSWORD_RESET);
    });
  });

  describe("GET /wfzo/api/v1/email/templates/:code", () => {
    it("should get a specific template by code", async () => {
      const response = await request(http())
        .get(`/wfzo/api/v1/email/templates/${EmailTemplateCode.MEMBER_CREDENTIALS}`)
        .expect(200);

      const body = response.body as {
        templateCode?: string;
        name?: string;
        translations?: unknown[];
      };
      expect(body).toHaveProperty("templateCode", EmailTemplateCode.MEMBER_CREDENTIALS);
      expect(body).toHaveProperty("name");
      expect(body).toHaveProperty("translations");
      if (body.translations) {
        expect(body.translations).toBeInstanceOf(Array);
        expect(body.translations.length).toBeGreaterThan(0);
      }
    });

    it("should return 404 for non-existent template", async () => {
      await request(http()).get("/wfzo/api/v1/email/templates/NON_EXISTENT_CODE").expect(404);
    });
  });
});

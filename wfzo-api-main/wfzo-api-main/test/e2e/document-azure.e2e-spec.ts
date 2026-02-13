import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App as SupertestApp } from "supertest/types";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";

/**
 * Document Azure Blob Storage E2E Test
 * Tests uploading documents to real Azure Blob Storage
 *
 * This test requires Azure credentials to be set:
 * - AZURE_STORAGE_CONNECTION_STRING
 * - AZURE_STORAGE_CONTAINER (defaults to wfzo-member)
 */
describe("Document Azure Blob Storage (e2e)", () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let uploadedDocumentId: string;
  const http = () => app.getHttpServer() as unknown as SupertestApp;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    // Set Azure Blob Storage credentials
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.log(
        "⚠️  AZURE_STORAGE_CONNECTION_STRING not set. Document upload tests will be skipped.",
      );
    }

    // Set container name (defaults to wfzo-member if not specified)
    if (!process.env.AZURE_STORAGE_CONTAINER) {
      process.env.AZURE_STORAGE_CONTAINER = "wfzo-member";
      console.log("ℹ️  Using default container: wfzo-member");
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);
    await app.init();

    // Wait for migrations to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe("POST /wfzo/api/v1/document/upload", () => {
    it("should upload a test PDF document to Azure Blob Storage", async () => {
      // Skip if Azure credentials are not configured
      if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
        console.log("⏭️  Skipping Azure Blob upload test - no Azure credentials");
        return;
      }

      // Create a sample PDF content
      const testPdfContent = Buffer.from(
        `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document for WFZO) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000315 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
408
%%EOF`,
      );

      const response = await request(http())
        .post("/wfzo/api/v1/document/upload")
        .field("mediaKind", "document")
        .field("purpose", "member-test-document")
        .field("isPublic", "false") // Test with private document
        .attach("file", testPdfContent, {
          filename: "test-member-document.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty("id");
      expect(response.body.fileName).toBe("test-member-document.pdf");
      expect(response.body.contentType).toBe("application/pdf");
      expect(response.body.mediaKind).toBe("document");
      expect(response.body.isPublic).toBe(false);
      expect(response.body.size).toBeGreaterThan(0);
      expect(response.body.variants).toHaveLength(1);
      expect(response.body.variants[0].key).toBe("original");

      // Store document ID for cleanup
      uploadedDocumentId = response.body.id as string;

      console.log("✅ Document uploaded successfully to Azure Blob Storage");
      console.log(`   Document ID: ${uploadedDocumentId}`);
      console.log(`   File name: ${response.body.fileName}`);
      console.log(`   Content type: ${response.body.contentType}`);
      console.log(`   Size: ${response.body.size} bytes`);
      console.log(`   Blob name: ${response.body.variants[0].url}`);
    }, 15000); // Timeout of 15 seconds for Azure upload

    it("should upload a public image to Azure Blob Storage", async () => {
      // Skip if Azure credentials are not configured
      if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
        console.log("⏭️  Skipping Azure Blob upload test - no Azure credentials");
        return;
      }

      // Create a simple PNG image (1x1 red pixel)
      const testImageContent = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64",
      );

      const response = await request(http())
        .post("/wfzo/api/v1/document/upload")
        .field("mediaKind", "image")
        .field("purpose", "member-logo")
        .field("isPublic", "true") // Test with public image
        .attach("file", testImageContent, {
          filename: "test-company-logo.png",
          contentType: "image/png",
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty("id");
      expect(response.body.fileName).toBe("test-company-logo.png");
      expect(response.body.contentType).toBe("image/png");
      expect(response.body.mediaKind).toBe("image");
      expect(response.body.isPublic).toBe(true);
      expect(response.body).toHaveProperty("publicUrl");
      expect(response.body.publicUrl).toContain(".png");

      console.log("✅ Public image uploaded successfully to Azure Blob Storage");
      console.log(`   Document ID: ${response.body.id}`);
      console.log(`   File name: ${response.body.fileName}`);
      console.log(`   Public URL: ${response.body.publicUrl}`);
    }, 15000); // Timeout of 15 seconds for Azure upload
  });

  describe("GET /wfzo/api/v1/document/:id/download", () => {
    it("should generate a signed download URL for the uploaded document", async () => {
      // Skip if Azure credentials are not configured or no document uploaded
      if (!process.env.AZURE_STORAGE_CONNECTION_STRING || !uploadedDocumentId) {
        console.log("⏭️  Skipping download URL test - no Azure credentials or document");
        return;
      }

      const response = await request(http())
        .get(`/wfzo/api/v1/document/${uploadedDocumentId}/download`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("expiresAt");
      expect(response.body.fileName).toBe("test-member-document.pdf");
      expect(response.body.contentType).toBe("application/pdf");
      expect(response.body.disposition).toBe("attachment");
      expect(response.body.variant).toBe("original");

      console.log("✅ Download URL generated successfully");
      console.log(`   URL: ${response.body.url.substring(0, 100)}...`);
      console.log(`   Expires at: ${response.body.expiresAt}`);
    }, 10000);
  });

  describe("GET /wfzo/api/v1/document/:id/status", () => {
    it("should get the status of the uploaded document", async () => {
      // Skip if no document uploaded
      if (!uploadedDocumentId) {
        console.log("⏭️  Skipping status test - no document uploaded");
        return;
      }

      const response = await request(http())
        .get(`/wfzo/api/v1/document/${uploadedDocumentId}/status`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(uploadedDocumentId);
      expect(response.body.status).toBe("ready");
      expect(response.body.variants).toHaveLength(1);
      expect(response.body.variants[0].ready).toBe(true);

      console.log("✅ Document status retrieved successfully");
      console.log(`   Status: ${response.body.status}`);
    });
  });

  describe("DELETE /wfzo/api/v1/document/:id", () => {
    it("should delete the uploaded document from Azure Blob Storage", async () => {
      // Skip if no document uploaded
      if (!uploadedDocumentId) {
        console.log("⏭️  Skipping delete test - no document uploaded");
        return;
      }

      await request(http()).delete(`/wfzo/api/v1/document/${uploadedDocumentId}`).expect(204);

      // Verify it's deleted
      await request(http()).get(`/wfzo/api/v1/document/${uploadedDocumentId}/status`).expect(404);

      console.log("✅ Document deleted successfully from Azure Blob Storage");

      // Clear the ID to prevent further operations
      uploadedDocumentId = "";
    }, 10000);
  });
});

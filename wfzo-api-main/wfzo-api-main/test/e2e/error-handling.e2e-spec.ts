import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongooseModule } from "@nestjs/mongoose";
import { applyAppSettings } from "../../src/bootstrap/app-setup";

describe("Error Handling (e2e)", () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), AppModule],
    })
      .overrideModule(MongooseModule)
      .useModule(MongooseModule.forRoot(uri))
      .compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe("Validation Error Handling", () => {
    it("should return detailed validation errors with all fields and constraints", async () => {
      const response = await request(app.getHttpServer())
        .post("/wfzo/api/v1/member")
        .send({
          category: "invalid-category",
          // Missing required fields: memberUsers, consents, etc.
        })
        .expect(400);

      console.log("\n📋 Full Error Response:");
      console.log(JSON.stringify(response.body, null, 2));

      // Check response structure
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("path");

      // Check that errors array exists and has items
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);

      // Check each error has the expected structure
      response.body.errors.forEach((error: unknown) => {
        expect(error).toHaveProperty("field");
        expect(error).toHaveProperty("constraints");
        expect(error).toHaveProperty("message");
      });

      // Verify specific validation errors are present
      const fieldNames = response.body.errors.map((e: { field: string }) => e.field);
      expect(fieldNames).toContain("category");
      expect(fieldNames).toContain("memberUsers");

      console.log("\n✅ All validation errors captured:");
      response.body.errors.forEach((error: { field: string; message: string }) => {
        console.log(`   - ${error.field}: ${error.message}`);
      });
    });

    it("should return detailed error for document upload with invalid fields", async () => {
      const response = await request(app.getHttpServer())
        .post("/wfzo/api/v1/document/upload")
        .field("mediaKind", "invalid-type") // Should be: document, image, or video
        .field("isPublic", "not-a-boolean") // Should be boolean
        .attach("file", Buffer.from("test content"), "test.txt")
        .expect(400);

      console.log("\n📋 Document Upload Error Response:");
      console.log(JSON.stringify(response.body, null, 2));

      // Check response has detailed validation errors
      expect(response.body).toHaveProperty("errors");
      if (response.body.errors) {
        expect(Array.isArray(response.body.errors)).toBe(true);

        console.log("\n✅ Document validation errors captured:");
        response.body.errors.forEach((error: { field: string; message: string }) => {
          console.log(`   - ${error.field}: ${error.message}`);
        });
      }
    });
  });

  describe("Other Error Types", () => {
    it("should return structured error for Not Found (404)", async () => {
      const response = await request(app.getHttpServer())
        .get("/wfzo/api/v1/member/NONEXISTENT-ID")
        .expect(404);

      console.log("\n📋 Not Found Error Response:");
      console.log(JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("path");
    });
  });
});

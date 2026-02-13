import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { MongooseModule } from "@nestjs/mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DocumentModule } from "../../src/modules/document/document.module";
import { BlobModule } from "../../src/shared/blob/blob.module";
import { ConfigModule } from "../../src/shared/config/config.module";
import { Document } from "../../src/modules/document/schemas/document.schema";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

describe("Document (e2e)", () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let documentModel: Model<Document>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), ConfigModule, BlobModule, DocumentModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    documentModel = moduleFixture.get<Model<Document>>(getModelToken(Document.name));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await documentModel.deleteMany({});
  });

  describe("POST /document/upload", () => {
    it("should upload a document successfully", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("mediaKind", "image")
        .field("purpose", "member-logo")
        .attach("file", Buffer.from("test image data"), {
          filename: "test.png",
          contentType: "image/png",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.fileName).toBe("test.png");
          expect(res.body.contentType).toBe("image/png");
          expect(res.body.mediaKind).toBe("image");
          expect(res.body.variants).toHaveLength(1);
          expect(res.body.variants[0].key).toBe("original");
          expect(res.body.isPublic).toBe(false); // Default to private
          expect(res.body.publicUrl).toBeUndefined(); // No public URL for private documents
        });
    });

    it("should upload a public document with publicUrl", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("mediaKind", "image")
        .field("purpose", "member-logo")
        .field("isPublic", "true")
        .attach("file", Buffer.from("test logo data"), {
          filename: "logo.png",
          contentType: "image/png",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.fileName).toBe("logo.png");
          expect(res.body.isPublic).toBe(true);
          expect(res.body.publicUrl).toBeDefined();
          expect(res.body.publicUrl).toContain(".png"); // Contains file extension
        });
    });

    it("should upload a private document by default when isPublic is not specified", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("mediaKind", "document")
        .field("purpose", "library-pdf")
        .attach("file", Buffer.from("private pdf data"), {
          filename: "library.pdf",
          contentType: "application/pdf",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.fileName).toBe("library.pdf");
          expect(res.body.mediaKind).toBe("document");
          expect(res.body.isPublic).toBe(false); // Defaults to private
          expect(res.body.publicUrl).toBeUndefined(); // No public URL for private documents
        });
    });

    it("should upload a private document when isPublic is false", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("mediaKind", "document")
        .field("purpose", "member-document")
        .field("isPublic", "false")
        .attach("file", Buffer.from("member private data"), {
          filename: "member-doc.pdf",
          contentType: "application/pdf",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.fileName).toBe("member-doc.pdf");
          expect(res.body.isPublic).toBe(false);
          expect(res.body.publicUrl).toBeUndefined();
        });
    });

    it("should upload with custom fileName", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("fileName", "custom-name.jpg")
        .attach("file", Buffer.from("test data"), {
          filename: "original.jpg",
          contentType: "image/jpeg",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.fileName).toBe("custom-name.jpg");
        });
    });

    it("should detect video media kind", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("video data"), {
          filename: "video.mp4",
          contentType: "video/mp4",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.mediaKind).toBe("video");
        });
    });

    it("should detect document media kind for PDFs", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("pdf data"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.mediaKind).toBe("document");
        });
    });

    it("should return 400 if file is missing", () => {
      return request(app.getHttpServer())
        .post("/document/upload")
        .field("mediaKind", "image")
        .expect(400);
    });
  });

  describe("GET /document/:id/download", () => {
    it("should generate signed URL for private document", async () => {
      // Upload a private document
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .field("isPublic", "false")
        .attach("file", Buffer.from("private data"), {
          filename: "private.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      const documentId = uploadRes.body.id;

      // Get signed URL for private document
      return request(app.getHttpServer())
        .get(`/document/${documentId}/download`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("url");
          expect(res.body).toHaveProperty("expiresAt");
          expect(res.body.disposition).toBe("attachment");
          expect(res.body.fileName).toBe("private.pdf");
          expect(res.body.variant).toBe("original");
          expect(res.body.url).toContain(".pdf"); // Contains file extension
        });
    });

    it("should generate public URL for public document", async () => {
      // Upload a public document
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .field("isPublic", "true")
        .attach("file", Buffer.from("public logo"), {
          filename: "public-logo.png",
          contentType: "image/png",
        })
        .expect(201);

      const documentId = uploadRes.body.id;
      const publicUrlFromUpload = uploadRes.body.publicUrl;

      // Get URL for public document
      return request(app.getHttpServer())
        .get(`/document/${documentId}/download`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("url");
          expect(res.body).toHaveProperty("expiresAt");
          expect(res.body.disposition).toBe("attachment");
          expect(res.body.fileName).toBe("public-logo.png");
          expect(res.body.variant).toBe("original");
          expect(res.body.url).toContain(".png");
          // For public documents, download URL should match the public URL from upload
          expect(res.body.url).toBe(publicUrlFromUpload);
        });
    });

    it("should generate signed URL for uploaded document (backward compatibility)", async () => {
      // First upload a document without specifying isPublic
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("test data"), {
          filename: "test.png",
          contentType: "image/png",
        })
        .expect(201);

      const documentId = uploadRes.body.id;

      // Verify document is private by default
      expect(uploadRes.body.isPublic).toBe(false);
      expect(uploadRes.body.publicUrl).toBeUndefined();

      // Then get download URL - should work for private documents
      return request(app.getHttpServer())
        .get(`/document/${documentId}/download`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("url");
          expect(res.body).toHaveProperty("expiresAt");
          expect(res.body.disposition).toBe("attachment");
          expect(res.body.fileName).toBe("test.png");
          expect(res.body.variant).toBe("original");
          expect(res.body.url).toContain(".png");
        });
    });

    it("should use inline disposition when requested", async () => {
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("test data"), {
          filename: "test.png",
          contentType: "image/png",
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/document/${uploadRes.body.id}/download?inline=true`)
        .expect(200)
        .expect((res) => {
          expect(res.body.disposition).toBe("inline");
        });
    });

    it("should return 404 for non-existent document", () => {
      const fakeUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      return request(app.getHttpServer()).get(`/document/${fakeUuid}/download`).expect(404);
    });

    it("should return 400 for invalid UUID", () => {
      return request(app.getHttpServer()).get("/document/invalid-uuid/download").expect(400);
    });
  });

  describe("GET /document/:id/status", () => {
    it("should return document status", async () => {
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("test data"), {
          filename: "test.png",
          contentType: "image/png",
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/document/${uploadRes.body.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(uploadRes.body.id);
          expect(res.body.status).toBe("ready");
          expect(res.body).toHaveProperty("updatedAt");
          expect(res.body.variants).toHaveLength(1);
        });
    });

    it("should return 404 for non-existent document", () => {
      const fakeUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      return request(app.getHttpServer()).get(`/document/${fakeUuid}/status`).expect(404);
    });
  });

  describe("DELETE /document/:id", () => {
    it("should delete a document", async () => {
      const uploadRes = await request(app.getHttpServer())
        .post("/document/upload")
        .attach("file", Buffer.from("test data"), {
          filename: "test.png",
          contentType: "image/png",
        })
        .expect(201);

      const documentId = uploadRes.body.id;

      // Delete the document
      await request(app.getHttpServer()).delete(`/document/${documentId}`).expect(204);

      // Verify it's gone
      await request(app.getHttpServer()).get(`/document/${documentId}/status`).expect(404);
    });

    it("should return 404 when deleting non-existent document", () => {
      const fakeUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      return request(app.getHttpServer()).delete(`/document/${fakeUuid}`).expect(404);
    });
  });
});

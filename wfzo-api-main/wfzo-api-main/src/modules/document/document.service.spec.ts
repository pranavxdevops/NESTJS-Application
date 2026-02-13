/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DocumentService } from "./document.service";
import { BlobStorageService } from "@shared/blob/blob.service";
import { DocumentRepository } from "./repository/document.repository";
import type { UploadedFile } from "./dto/document.dto";

describe("DocumentService", () => {
  let service: DocumentService;
  let blobService: jest.Mocked<BlobStorageService>;
  let repository: jest.Mocked<DocumentRepository>;

  const mockBlobService = {
    uploadBuffer: jest.fn(),
    getSignedUrl: jest.fn(),
    getPublicUrl: jest.fn(),
    delete: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: BlobStorageService, useValue: mockBlobService },
        { provide: DocumentRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    blobService = module.get(BlobStorageService);
    repository = module.get(DocumentRepository);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("upload", () => {
    it("should upload a document successfully", async () => {
      const file: UploadedFile = {
        originalname: "test.png",
        mimetype: "image/png",
        size: 1024,
        buffer: Buffer.from("test"),
      };

      const mockDoc = {
        id: "test-uuid",
        fileName: "test.png",
        contentType: "image/png",
        size: 1024,
        mediaKind: "image",
        blobName: "images/123-test-uuid.png",
        status: "ready",
        variants: [
          {
            key: "original",
            url: "images/123-test-uuid.png",
            contentType: "image/png",
            size: 1024,
            ready: true,
          },
        ],
        createdAt: new Date(),
      };

      blobService.uploadBuffer.mockResolvedValue("https://blob.storage/images/123-test-uuid.png");
      repository.create.mockResolvedValue(mockDoc as any);

      const result = await service.upload(file);

      expect(result).toHaveProperty("id");
      expect(result.fileName).toBe("test.png");
      expect(result.contentType).toBe("image/png");
      expect(result.size).toBe(1024);
      expect(result.mediaKind).toBe("image");
      expect(blobService.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining(".png"),
        file.buffer,
        "image/png",
        false, // isPublic defaults to false
      );
      expect(repository.create).toHaveBeenCalled();
    });

    it("should upload a public document successfully", async () => {
      const file: UploadedFile = {
        originalname: "logo.png",
        mimetype: "image/png",
        size: 2048,
        buffer: Buffer.from("logo"),
      };

      const mockDoc = {
        id: "public-uuid",
        fileName: "logo.png",
        contentType: "image/png",
        size: 2048,
        mediaKind: "image",
        blobName: "images/123-public-uuid.png",
        status: "ready",
        isPublic: true,
        variants: [
          {
            key: "original",
            url: "images/123-public-uuid.png",
            contentType: "image/png",
            size: 2048,
            ready: true,
          },
        ],
        createdAt: new Date(),
      };

      blobService.uploadBuffer.mockResolvedValue("https://blob.storage/images/123-public-uuid.png");
      blobService.getPublicUrl.mockReturnValue("https://blob.storage/images/123-public-uuid.png");
      repository.create.mockResolvedValue(mockDoc);

      const result = await service.upload(file, { isPublic: true });

      expect(result).toHaveProperty("id");
      expect(result.fileName).toBe("logo.png");
      expect(result.isPublic).toBe(true);
      expect(blobService.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining(".png"),
        file.buffer,
        "image/png",
        true, // isPublic=true
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true,
        }),
      );
    });

    it("should upload a private document by default", async () => {
      const file: UploadedFile = {
        originalname: "private.pdf",
        mimetype: "application/pdf",
        size: 3072,
        buffer: Buffer.from("private"),
      };

      const mockDoc = {
        id: "private-uuid",
        fileName: "private.pdf",
        contentType: "application/pdf",
        size: 3072,
        mediaKind: "document",
        blobName: "documents/123-private-uuid.pdf",
        status: "ready",
        isPublic: false,
        variants: [
          {
            key: "original",
            url: "documents/123-private-uuid.pdf",
            contentType: "application/pdf",
            size: 3072,
            ready: true,
          },
        ],
        createdAt: new Date(),
      };

      blobService.uploadBuffer.mockResolvedValue(
        "https://blob.storage/documents/123-private-uuid.pdf",
      );
      repository.create.mockResolvedValue(mockDoc);

      const result = await service.upload(file);

      expect(result.isPublic).toBe(false);
      expect(blobService.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining(".pdf"),
        file.buffer,
        "application/pdf",
        false, // isPublic defaults to false
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: false,
        }),
      );
    });

    it("should detect media kind from content type", async () => {
      const videoFile: UploadedFile = {
        originalname: "test.mp4",
        mimetype: "video/mp4",
        size: 2048,
        buffer: Buffer.from("video"),
      };

      const mockDoc = {
        id: "test-uuid",
        fileName: "test.mp4",
        contentType: "video/mp4",
        size: 2048,
        mediaKind: "video",
        blobName: "videos/123-test-uuid.mp4",
        status: "ready",
        variants: [],
        createdAt: new Date(),
      };

      blobService.uploadBuffer.mockResolvedValue("https://blob.storage/videos/123-test-uuid.mp4");
      repository.create.mockResolvedValue(mockDoc as any);

      const result = await service.upload(videoFile);

      expect(result.mediaKind).toBe("video");
    });

    it("should verify checksum if provided", async () => {
      const file: UploadedFile = {
        originalname: "test.pdf",
        mimetype: "application/pdf",
        size: 512,
        buffer: Buffer.from("test"),
      };

      await expect(service.upload(file, { checksum: "invalid-checksum" })).rejects.toThrow(
        "Checksum mismatch",
      );
    });

    it("should use custom fileName if provided", async () => {
      const file: UploadedFile = {
        originalname: "original.png",
        mimetype: "image/png",
        size: 1024,
        buffer: Buffer.from("test"),
      };

      const mockDoc = {
        id: "test-uuid",
        fileName: "custom-name.png",
        contentType: "image/png",
        size: 1024,
        mediaKind: "image",
        blobName: "images/123-test-uuid.png",
        status: "ready",
        variants: [],
        createdAt: new Date(),
      };

      blobService.uploadBuffer.mockResolvedValue("url");
      repository.create.mockResolvedValue(mockDoc as any);

      const result = await service.upload(file, { fileName: "custom-name.png" });

      expect(result.fileName).toBe("custom-name.png");
    });
  });

  describe("getSignedUrl", () => {
    it("should generate signed URL for private document", async () => {
      const mockDoc = {
        id: "test-uuid",
        fileName: "test.png",
        contentType: "image/png",
        size: 1024,
        blobName: "images/test.png",
        isPublic: false,
        variants: [
          {
            key: "original",
            url: "images/test.png",
            contentType: "image/png",
            size: 1024,
            ready: true,
          },
        ],
      };

      repository.findOne.mockResolvedValue(mockDoc as any);
      blobService.getSignedUrl.mockReturnValue("https://signed.url/test.png?sig=abc");

      const result = await service.getSignedUrl("test-uuid");

      expect(result.url).toBe("https://signed.url/test.png?sig=abc");
      expect(result.disposition).toBe("attachment");
      expect(result.fileName).toBe("test.png");
      expect(blobService.getSignedUrl).toHaveBeenCalledWith("images/test.png", 3600);
    });

    it("should generate public URL for public document", async () => {
      const mockDoc = {
        id: "public-uuid",
        fileName: "logo.png",
        contentType: "image/png",
        size: 2048,
        blobName: "images/logo.png",
        isPublic: true,
        variants: [
          {
            key: "original",
            url: "images/logo.png",
            contentType: "image/png",
            size: 2048,
            ready: true,
          },
        ],
      };

      repository.findOne.mockResolvedValue(mockDoc as any);
      blobService.getPublicUrl.mockReturnValue("https://blob.storage/images/logo.png");

      const result = await service.getSignedUrl("public-uuid");

      expect(result.url).toBe("https://blob.storage/images/logo.png");
      expect(result.disposition).toBe("attachment");
      expect(result.fileName).toBe("logo.png");
      expect(blobService.getPublicUrl).toHaveBeenCalledWith("images/logo.png");
      expect(blobService.getSignedUrl).not.toHaveBeenCalled();
    });

    it("should generate public URL for public document with inline disposition", async () => {
      const mockDoc = {
        id: "public-uuid",
        fileName: "banner.jpg",
        contentType: "image/jpeg",
        size: 3072,
        blobName: "images/banner.jpg",
        isPublic: true,
        variants: [
          {
            key: "original",
            url: "images/banner.jpg",
            contentType: "image/jpeg",
            size: 3072,
            ready: true,
          },
        ],
      };

      repository.findOne.mockResolvedValue(mockDoc as any);
      blobService.getPublicUrl.mockReturnValue("https://blob.storage/images/banner.jpg");

      const result = await service.getSignedUrl("public-uuid", undefined, true);

      expect(result.url).toBe("https://blob.storage/images/banner.jpg");
      expect(result.disposition).toBe("inline");
      expect(blobService.getPublicUrl).toHaveBeenCalledWith("images/banner.jpg");
    });

    it("should throw NotFoundException when document not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getSignedUrl("non-existent-id")).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when variant not found", async () => {
      const mockDoc = {
        id: "test-uuid",
        fileName: "test.png",
        variants: [
          {
            key: "original",
            url: "images/test.png",
            contentType: "image/png",
            ready: true,
          },
        ],
      };

      repository.findOne.mockResolvedValue(mockDoc as any);

      await expect(service.getSignedUrl("test-uuid", "thumbnail")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should use inline disposition when requested", async () => {
      const mockDoc = {
        id: "test-uuid",
        fileName: "test.png",
        variants: [
          {
            key: "original",
            url: "images/test.png",
            contentType: "image/png",
            ready: true,
          },
        ],
      };

      repository.findOne.mockResolvedValue(mockDoc as any);
      blobService.getSignedUrl.mockReturnValue("https://signed.url/test.png");

      const result = await service.getSignedUrl("test-uuid", undefined, true);

      expect(result.disposition).toBe("inline");
    });
  });

  describe("getStatus", () => {
    it("should return document status", async () => {
      const mockDoc = {
        id: "test-uuid",
        status: "ready",
        statusMessage: "Processing complete",
        variants: [
          {
            key: "original",
            url: "images/test.png",
            contentType: "image/png",
            ready: true,
          },
        ],
        updatedAt: new Date("2025-10-18T10:30:00Z"),
      };

      repository.findOne.mockResolvedValue(mockDoc as any);

      const result = await service.getStatus("test-uuid");

      expect(result.id).toBe("test-uuid");
      expect(result.status).toBe("ready");
      expect(result.message).toBe("Processing complete");
      expect(result.variants).toHaveLength(1);
    });

    it("should throw NotFoundException when document not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getStatus("non-existent-id")).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete document and blob", async () => {
      const mockDoc = {
        id: "test-uuid",
        blobName: "images/test.png",
      };

      repository.findOne.mockResolvedValue(mockDoc as any);
      repository.deleteOne.mockResolvedValue(true);
      blobService.delete.mockResolvedValue(undefined);

      const result = await service.delete("test-uuid");

      expect(result).toBe(true);
      expect(blobService.delete).toHaveBeenCalledWith("images/test.png");
      expect(repository.deleteOne).toHaveBeenCalledWith({ id: "test-uuid" });
    });

    it("should throw NotFoundException when document not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete("non-existent-id")).rejects.toThrow(NotFoundException);
    });
  });
});

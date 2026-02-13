import { Injectable, NotFoundException } from "@nestjs/common";
import { BlobStorageService } from "@shared/blob/blob.service";
import { ConfigService } from "@shared/config/config.service";
import { DocumentRepository } from "./repository/document.repository";
import type {
  DocumentAsset,
  DocumentStatus,
  SignedUrlResponse,
  UploadedFile,
  MediaKind,
} from "./dto/document.dto";
import { randomUUID } from "node:crypto";
import path from "node:path";

interface DeleteResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly blob: BlobStorageService,
    private readonly repository: DocumentRepository,
    private readonly config: ConfigService,
  ) {}

  async upload(
    file: UploadedFile,
    opts?: {
      fileName?: string;
      contentType?: string;
      mediaKind?: MediaKind;
      purpose?: string;
      uploadedBy?: string;
      isPublic?: boolean;
      memberId?: string;
    },
  ): Promise<DocumentAsset> {
    const id = randomUUID();
    const fileName = opts?.fileName ?? file.originalname;
    const contentType = opts?.contentType ?? file.mimetype;
    const mediaKind = opts?.mediaKind ?? this.detectMediaKind(contentType);
    const isPublic = opts?.isPublic ?? false;
    const memberId = opts?.memberId;
    const purpose = opts?.purpose;

    // Generate blob name with folder structure
    const blobName = this.generateBlobName(mediaKind, id, fileName, memberId, purpose);

    // Upload to blob storage with public/private access
    await this.blob.uploadBuffer(blobName, file.buffer, contentType, isPublic);

    // Create document record in database
    const doc = await this.repository.create({
      id,
      fileName,
      contentType,
      size: file.size,
      mediaKind,
      purpose: opts?.purpose,
      blobName,
      status: "ready",
      uploadedBy: opts?.uploadedBy,
      isPublic,
      variants: [
        {
          key: "original",
          url: blobName, // Store blob name, not full URL
          contentType,
          size: file.size,
          ready: true,
        },
      ],
    });

    return this.mapToAsset(doc);
  }

  async getSignedUrl(
    id: string,
    variant?: string,
    inline: boolean = false,
  ): Promise<SignedUrlResponse> {
    const doc = await this.repository.findOne({ id });
    if (!doc) {
      throw new NotFoundException(`Document with id '${id}' not found`);
    }

    // If document is public, return the public URL with signed URL for security and caching
    if (doc.isPublic) {
      const variantKey = variant ?? "original";
      const docVariant = doc.variants?.find((v) => v.key === variantKey);

      if (!docVariant) {
        throw new NotFoundException(`Variant '${variantKey}' not found for document '${id}'`);
      }

      // Generate signed URL with 12h expiry for public documents (for consistency and caching)
      const signedUrl = this.blob.getSignedUrl(docVariant.url, 43200); // 12 hours

      return {
        url: signedUrl,
        expiresAt: new Date(Date.now() + 43200_000).toISOString(), // 12 hours in milliseconds
        contentType: docVariant.contentType,
        fileName: doc.fileName,
        size: docVariant.size ?? doc.size,
        disposition: inline ? "inline" : "attachment",
        variant: variantKey,
      };
    }

    // Find the requested variant or default to original
    const variantKey = variant ?? "original";
    const docVariant = doc.variants?.find((v) => v.key === variantKey);

    if (!docVariant) {
      throw new NotFoundException(`Variant '${variantKey}' not found for document '${id}'`);
    }

    // Generate signed URL with 12h expiry for private documents
    const url = this.blob.getSignedUrl(docVariant.url, 43200); // 12 hours

    return {
      url,
      expiresAt: new Date(Date.now() + 43200_000).toISOString(), // 12 hours in milliseconds
      contentType: docVariant.contentType,
      fileName: doc.fileName,
      size: docVariant.size ?? doc.size,
      disposition: inline ? "inline" : "attachment",
      variant: variantKey,
    };
  }

  async getStatus(id: string): Promise<DocumentStatus> {
    const doc = await this.repository.findOne({ id });
    if (!doc) {
      throw new NotFoundException(`Document with id '${id}' not found`);
    }

    return {
      id: doc.id,
      status: doc.status,
      message: doc.statusMessage ?? null,
      variants: doc.variants,
      updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    const doc = await this.repository.findOne({ id });
    if (!doc) {
      throw new NotFoundException(`Document with id '${id}' not found`);
    }

    // Delete from blob storage
    await this.blob.delete(doc.blobName);

    // Soft delete from database
    return this.repository.deleteOne({ id });
  }

  async deleteByUrl(urlOrName: string): Promise<DeleteResponse> {
    if (!urlOrName) {
      return {
        success: false,
        message: "URL or blob name is required",
      };
    }

    try {
      let blobName = urlOrName;

      // ================================
      // Extract blob name from Azure URL
      // ================================
      try {
        const parsed = new URL(urlOrName);
        const container = this.config.getBlobContainer();
        const prefix = `/${container}/`;

        if (parsed.pathname.startsWith(prefix)) {
          blobName = decodeURIComponent(parsed.pathname.slice(prefix.length));
        } else if (parsed.pathname.startsWith("/")) {
          blobName = parsed.pathname.slice(1);
        } else {
          blobName = parsed.pathname;
        }
      } catch {
        // Not a URL — it's already a blob name
        blobName = urlOrName;
      }

      // Strip container prefix again if needed
      const containerName = this.config.getBlobContainer();
      const containerPrefix = `${containerName}/`;
      if (blobName.startsWith(containerPrefix)) {
        blobName = blobName.slice(containerPrefix.length);
      }

      if (!blobName) {
        return {
          success: false,
          message: "Unable to extract blob name from URL",
        };
      }

      // ================================
      // Delete from Azure Blob Storage
      // ================================
      try {
        await this.blob.delete(blobName);
      } catch (err) {
        return {
          success: false,
          message: "Failed to delete blob from Azure Storage",
          data: err instanceof Error ? err.message : err,
        };
      }

      // ================================
      // Delete DB record (soft delete)
      // ================================
      try {
        const doc = await this.repository.findByBlobName(blobName);
        if (doc) {
          await this.repository.deleteOne({ id: doc.id }, false);

          return {
            success: true,
            message: "Blob and database record deleted successfully",
            data: { blobName, recordDeleted: true },
          };
        }
      } catch (err) {
        return {
          success: false,
          message: "Blob deleted, but database record deletion failed",
          data: err instanceof Error ? err.message : err,
        };
      }

      // No DB record exists
      return {
        success: true,
        message: "Blob deleted successfully (no database record found)",
        data: { blobName, recordDeleted: false },
      };
    } catch (error: any) {
      // Catch unexpected errors
      return {
        success: false,
        message: "Unexpected error while deleting blob",
        data: error?.message ?? error,
      };
    }
  }

  private detectMediaKind(contentType: string): MediaKind {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    return "document";
  }

  private generateBlobName(mediaKind: MediaKind, id: string, fileName: string, memberId?: string, purpose?: string): string {
    const ext = path.extname(fileName);
    if (!memberId) {
      const timestamp = Date.now();
      return `${mediaKind}s/${timestamp}-${id}${ext}`;
    }

    let suffix: string | undefined;
    if (mediaKind === "document" || mediaKind === "image") {
      suffix = purpose;
    } else {
      // for video or others, fallback
      suffix = id;
    }

    const filename = `${memberId}-${suffix}${ext}`;
    const folder = `${mediaKind}s/${memberId}/`;
    return `${folder}${filename}`;
  }

  private mapToAsset(doc: any): DocumentAsset {
    const asset: DocumentAsset = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: doc.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      fileName: doc.fileName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      contentType: doc.contentType,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      size: doc.size,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      mediaKind: doc.mediaKind,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      isPublic: doc.isPublic ?? false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      variants: doc.variants,
    };

    // Add signed URL with 12h expiry for all documents (public and private)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (doc.blobName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const signedUrlData = this.blob.getSignedUrlWithMetadata(doc.blobName, 43200); // 12 hours
      asset.publicUrl = signedUrlData.url;
      asset.urlExpiresAt = signedUrlData.expiresAt.toISOString();
      asset.urlExpiresIn = signedUrlData.expiresIn;
    }

    return asset;
  }
}

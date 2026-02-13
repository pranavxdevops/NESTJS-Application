import { Injectable } from "@nestjs/common";
import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { ConfigService } from "@shared/config/config.service";

@Injectable()
export class BlobStorageService {
  private container: ContainerClient | null = null;
  private readonly disabled: boolean;
  private accountName: string = "";
  private accountKey: string = "";

  constructor(private readonly config: ConfigService) {
    const conn = this.config.getBlobConnectionString();
    const container = this.config.getBlobContainer();
    if (conn) {
      const client = BlobServiceClient.fromConnectionString(conn);
      this.container = client.getContainerClient(container);
      this.disabled = false;
      // Extract account name and key from connection string for SAS generation
      this.extractCredentialsFromConnectionString(conn);
    } else {
      const accountUrl = this.config.getBlobAccountUrl();
      if (!accountUrl) {
        // No Azure config in this environment (e.g., tests). Operate in disabled mode.
        this.disabled = true;
        return;
      }
      const sas = this.config.getBlobSas();
      const client = new BlobServiceClient(`${accountUrl}${sas ? `?${sas}` : ""}`);
      this.container = client.getContainerClient(container);
      this.disabled = false;
    }
  }

  private extractCredentialsFromConnectionString(connectionString: string): void {
    const parts = connectionString.split(";");
    for (const part of parts) {
      if (part.startsWith("AccountName=")) {
        this.accountName = part.substring("AccountName=".length);
      }
      if (part.startsWith("AccountKey=")) {
        this.accountKey = part.substring("AccountKey=".length);
      }
    }
  }

  async uploadBuffer(
    name: string,
    buffer: Buffer,
    contentType?: string,
    isPublic: boolean = false,
  ): Promise<string> {
    if (this.disabled || !this.container) return `blob://disabled/${name}`;
    const blockBlob = this.container.getBlockBlobClient(name);
    const md5 = crypto.createHash("md5").update(buffer).digest();
    await blockBlob.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: isPublic ? "public, max-age=31536000" : "private, no-cache",
      },
      metadata: {
        isPublic: isPublic ? "true" : "false",
      },
    });
    await blockBlob.setHTTPHeaders({
      blobContentMD5: md5,
      blobContentType: contentType,
      blobCacheControl: isPublic ? "public, max-age=31536000" : "private, no-cache",
    });
    return blockBlob.url;
  }

  async exists(name: string): Promise<boolean> {
    if (this.disabled || !this.container) return false;
    const blob = this.container.getBlobClient(name);
    return blob.exists();
  }

  async delete(name: string): Promise<void> {
    if (this.disabled || !this.container) return;
    const blob = this.container.getBlobClient(name);
    await blob.deleteIfExists();
  }

  async uploadStream(
    name: string,
    stream: Readable,
    contentType?: string,
    isPublic: boolean = false,
  ): Promise<string> {
    if (this.disabled || !this.container) return `blob://disabled/${name}`;
    const blockBlob = this.container.getBlockBlobClient(name);
    await blockBlob.uploadStream(stream, 4 * 1024 * 1024, 5, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: isPublic ? "public, max-age=31536000" : "private, no-cache",
      },
      metadata: {
        isPublic: isPublic ? "true" : "false",
      },
    });
    return blockBlob.url;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSignedUrl(name: string, expiresInSeconds: number = 43200): string {
    // Default 12 hours = 43200 seconds
    if (this.disabled || !this.container) return `blob://disabled/${name}`;

    const blob = this.container.getBlobClient(name);

    // If using account URL + SAS at client level, return the existing signed URL
    if (blob.url.includes("?") && !this.accountName) {
      return blob.url;
    }

    // Generate new SAS token with account key
    if (!this.accountName || !this.accountKey) {
      throw new Error(
        "Signed URL generation requires account credentials. Provide AZURE_STORAGE_CONNECTION_STRING with AccountName and AccountKey.",
      );
    }

    try {
      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);

      const expiresOn = new Date();
      expiresOn.setSeconds(expiresOn.getSeconds() + expiresInSeconds);

      const permissions = new BlobSASPermissions();
      permissions.read = true;

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.container.containerName,
          blobName: name,
          permissions,
          expiresOn,
        },
        sharedKeyCredential,
      ).toString();

      return `${blob.url}?${sasToken}`;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      // Fallback to public URL if SAS generation fails
      return this.getPublicUrl(name);
    }
  }

  getPublicUrl(name: string): string {
    if (this.disabled || !this.container) return `blob://disabled/${name}`;
    const blob = this.container.getBlobClient(name);
    // Return the base URL without any SAS token
    return blob.url.split("?")[0];
  }

  /**
   * Extract blob path from full Azure Blob Storage URL
   * Used for migration from full URLs to relative paths
   */
  extractBlobPath(urlOrPath: string): string {
    if (!urlOrPath) return "";

    try {
      const url = new URL(urlOrPath);
      const containerName = this.config.getBlobContainer();
      const prefix = `/${containerName}/`;

      if (url.pathname.startsWith(prefix)) {
        return decodeURIComponent(url.pathname.slice(prefix.length));
      } else if (url.pathname.startsWith("/")) {
        return decodeURIComponent(url.pathname.slice(1));
      }
      return decodeURIComponent(url.pathname);
    } catch {
      // Not a URL, return as-is (already a blob path)
      return urlOrPath;
    }
  }

  /**
   * Generate a signed URL with metadata for auto-refresh
   * Returns URL along with expiration timestamp
   */
  getSignedUrlWithMetadata(
    name: string,
    expiresInSeconds: number = 43200,
  ): { url: string; expiresAt: Date; expiresIn: number } {
    const url = this.getSignedUrl(name, expiresInSeconds);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    return {
      url,
      expiresAt,
      expiresIn: expiresInSeconds,
    };
  }
}

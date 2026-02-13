// DTOs and types reflecting Document Management shapes from the OpenAPI spec.

import { IsEnum, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export type MediaKind = "document" | "image" | "video";
export type DocumentVariantKey = "original" | "thumbnail" | "preview" | "hlsManifest";
export type DocumentStatusType = "processing" | "ready" | "failed";

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: "Logical media type classification",
    enum: ["document", "image", "video"],
    example: "image",
  })
  @IsOptional()
  @IsEnum(["document", "image", "video"])
  mediaKind?: MediaKind;

  @ApiPropertyOptional({
    description: "Logical usage context (e.g., member-logo, event-hero, library-asset)",
    example: "member-logo",
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description: "Optional explicit file name override",
    example: "company-logo.png",
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: "Optional explicit MIME type; server may override based on detection",
    example: "image/png",
  })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({
    description: "Optional member ID for associating the document",
    example: "123",
  })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({
    description:
      "Whether the document should be publicly accessible (true) or require signed URLs (false). Public documents can be accessed directly without authentication. Use public for member logos, and private for library documents.",
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export type DocumentUploadForm = UploadDocumentDto;

export class DocumentVariantDto {
  key!: DocumentVariantKey;
  url!: string;
  contentType!: string;
  width?: number | null;
  height?: number | null;
  bitrateKbps?: number | null;
  size?: number | null;
  ready!: boolean;
}

export type DocumentVariant = DocumentVariantDto;

export interface DocumentAsset {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  mediaKind: MediaKind;
  isPublic: boolean;
  createdAt: string;
  variants?: DocumentVariant[];
  publicUrl?: string; // Signed URL with 12h expiry (for all documents)
  urlExpiresAt?: string; // ISO timestamp when the signed URL expires
  urlExpiresIn?: number; // Seconds until expiration (for auto-refresh calculation)
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
  contentType?: string;
  fileName?: string;
  size?: number | null;
  disposition: string;
  variant?: string | null;
}

export interface DocumentStatus {
  id: string;
  status: DocumentStatusType;
  message?: string | null;
  variants?: DocumentVariant[];
  updatedAt: string;
}

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

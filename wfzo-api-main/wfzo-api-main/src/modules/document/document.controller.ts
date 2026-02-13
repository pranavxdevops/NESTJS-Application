import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
  HttpCode,
  Delete,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { EntraJwtAuthGuard } from "../auth/guards/entra-jwt.guard";
import { DocumentService } from "./document.service";
import {
  type DocumentAsset,
  type DocumentStatus,
  type UploadedFile as Uploaded,
  UploadDocumentDto,
} from "./dto/document.dto";

/**
 * UnifiedAuthGuard - Accepts BOTH internal JWT tokens AND Entra ID tokens
 *
 * This allows both:
 * - Internal admins (using our JWT)
 * - External members (using Entra ID JWT)
 */
class UnifiedAuthGuard {
  constructor() {}

  async canActivate(context: any) {
    // Try Entra JWT first (for external SSO users)
    const entraGuard = new EntraJwtAuthGuard();
    try {
      const result = await entraGuard.canActivate(context);
      if (result) return true;
    } catch (err) {
      // Entra JWT failed, try internal JWT
    }

    // Try internal JWT (for internal admins and legacy external users)
    const jwtGuard = new JwtAuthGuard();
    return jwtGuard.canActivate(context);
  }
}

interface DeleteResponse {
  success: boolean;
  message: string;
  data?: any;
}

@ApiTags("Document Management")
@Controller("document")
//@UseGuards(UnifiedAuthGuard) // ✅ Accepts both Entra JWT AND internal JWT
//@ApiBearerAuth() // Swagger documentation
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Upload a new document (multipart)",
    description: `Upload a file with optional metadata. Supports both public and private access modes:

**Public Access (isPublic=true):**
- Files are accessible without authentication via direct URL
- Suitable for: Member logos, public images, publicly viewable content
- Returns a publicUrl in the response for direct access
- Example use cases: company-logo.png, hero-image.jpg

**Private Access (isPublic=false, default):**
- Files require signed URLs for access (time-limited, secure)
- Suitable for: Library documents, member-only PDFs, protected content
- Access via /document/:id/download endpoint which generates signed URLs
- Example use cases: member-library.pdf, restricted-document.docx

For large files, chunked uploads can be handled out-of-band; this endpoint registers and stores the final artifact.`,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File upload with optional metadata",
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The file to upload",
        },
        mediaKind: {
          type: "string",
          enum: ["document", "image", "video"],
          description: "Logical media type classification",
          example: "image",
        },
        purpose: {
          type: "string",
          description: "Logical usage context (e.g., member-logo, event-hero, library-asset)",
          example: "member-logo",
        },
        fileName: {
          type: "string",
          description: "Optional explicit file name override",
        },
        contentType: {
          type: "string",
          description: "Optional explicit MIME type; server may override based on detection",
        },
        memberId: {
          type: "string",
          description: "Optional member ID for associating the document",
          example: "MEMBER-123",
        },
        isPublic: {
          type: "boolean",
          description:
            "Whether the document should be publicly accessible (true) or require signed URLs (false). Use public for member logos, and private for library documents.",
          example: true,
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Document uploaded successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
        fileName: { type: "string", example: "company-logo.png" },
        contentType: { type: "string", example: "image/png" },
        size: { type: "number", example: 2048576 },
        mediaKind: { type: "string", enum: ["document", "image", "video"], example: "image" },
        isPublic: { type: "boolean", example: true },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2025-10-18T10:30:00Z",
        },
        publicUrl: {
          type: "string",
          format: "uri",
          description: "Direct public URL (only present for public documents)",
          example: "https://blob.storage/images/1234567890-uuid.png",
        },
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                enum: ["original", "thumbnail", "preview", "hlsManifest"],
              },
              url: { type: "string" },
              contentType: { type: "string" },
              size: { type: "number" },
              ready: { type: "boolean" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async upload(@UploadedFile() file: any, @Body() body: UploadDocumentDto): Promise<DocumentAsset> {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const f = file as unknown as {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    };

    const safe: Uploaded = {
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      buffer: f.buffer,
    };

    return this.service.upload(safe, {
      fileName: body?.fileName,
      contentType: body?.contentType,
      mediaKind: body?.mediaKind,
      purpose: body?.purpose,
      isPublic: body?.isPublic,
      memberId: body?.memberId,
    });
  }

  @Get(":id/download")
  @ApiOperation({
    summary: "Get a time-limited download URL (for private documents)",
    description: `Returns a signed URL object for downloading or streaming the requested variant.

**Important:** This endpoint is only needed for PRIVATE documents (isPublic=false).
For PUBLIC documents, use the publicUrl returned from the upload endpoint directly.

Use cases for private (signed URL) access:
- Library documents accessible only to authenticated members
- Protected PDFs uploaded from Strapi
- Member-restricted content

Use cases for public (direct URL) access:
- Member logos (use publicUrl from upload response)
- Public images
- Publicly viewable content`,
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
    example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  })
  @ApiQuery({
    name: "variant",
    required: false,
    type: "string",
    enum: ["original", "thumbnail", "preview", "hlsManifest"],
    description: "Specific variant to download (defaults to original)",
    example: "original",
  })
  @ApiQuery({
    name: "inline",
    required: false,
    type: "boolean",
    description: "Whether to serve inline (true) or as attachment (false)",
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: "Signed download URL generated",
    schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          example: "https://blob.storage/path/to/file?sig=...",
        },
        expiresAt: {
          type: "string",
          format: "date-time",
          example: "2025-10-18T11:30:00Z",
        },
        contentType: { type: "string", example: "image/png" },
        fileName: { type: "string", example: "company-logo.png" },
        size: { type: "number", example: 2048576 },
        disposition: { type: "string", enum: ["attachment", "inline"], example: "attachment" },
        variant: { type: "string", example: "original" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  download(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("variant") variant?: string,
    @Query("inline", new DefaultValuePipe(false), ParseBoolPipe) inline?: boolean,
  ) {
    return this.service.getSignedUrl(id, variant, inline);
  }

  @Get(":id/status")
  @ApiOperation({
    summary: "Get document processing status",
    description: "Returns processing status and available variants for the given document.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
    example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  })
  @ApiResponse({
    status: 200,
    description: "Document status retrieved",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
        status: { type: "string", enum: ["processing", "ready", "failed"], example: "ready" },
        message: { type: "string", nullable: true, example: "Processing complete" },
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                enum: ["original", "thumbnail", "preview", "hlsManifest"],
              },
              url: { type: "string" },
              contentType: { type: "string" },
              ready: { type: "boolean" },
            },
          },
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2025-10-18T10:35:00Z",
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  status(@Param("id", ParseUUIDPipe) id: string): Promise<DocumentStatus> {
    return this.service.getStatus(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a document",
    description:
      "Permanently deletes a document and all its variants from blob storage and database.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
    example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.service.delete(id);
  }

  @Post("delete-by-url")
  @ApiOperation({
    summary: "Delete a document by its blob URL or blob name",
    description:
      "Provide either the full blob URL or the internal blob name and the document (blob + DB record if present) will be deleted.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", format: "uri", description: "Full blob URL or blob name" },
      },
    },
  })
  @ApiResponse({ status: 204, description: "Blob deleted (and DB record removed if present)" })
  async deleteByUrl(@Body("url") url: string): Promise<DeleteResponse> {
    if (!url) {
      throw new BadRequestException("'url' is required in request body");
    }

    return await this.service.deleteByUrl(url);
  }
}

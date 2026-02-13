import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { ConfigService } from "@shared/config/config.service";
import {
  CreateSearchDocumentDto,
  SearchDocumentsDto,
  UpdateSearchDocumentDto,
  SearchResults,
  CreateDocumentResponse,
  UpdateDocumentResponse,
} from "./dto/search.dto";

@ApiTags("Search & Document Management")
@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly configService: ConfigService,
  ) {}

  @Post("documents")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new searchable document",
    description: "Adds a new document to the search index with optional embedding generation.",
  })
  @ApiResponse({
    status: 201,
    description: "Document created successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        created_at: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createDocument(@Body() dto: CreateSearchDocumentDto): Promise<CreateDocumentResponse> {
    return this.searchService.createDocument(dto);
  }

  @Post("")
  @ApiOperation({
    summary: "Search documents",
    description: "Search through indexed documents using keyword, semantic, or hybrid search.",
  })
  @ApiResponse({
    status: 200,
    description: "Search results",
    schema: {
      type: "object",
      properties: {
        hits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              score: { type: "number" },
              snippet: { type: "string" },
            },
          },
        },
        found: { type: "number" },
        search_time_ms: { type: "number" },
        facet_counts: { type: "array" },
        search_type_used: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async searchDocuments(@Body() dto: SearchDocumentsDto): Promise<SearchResults> {
    return this.searchService.searchDocuments(dto);
  }

  @Get("documents/:id")
  @ApiOperation({
    summary: "Get a specific document",
    description: "Retrieves a document by its ID from the search index.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
  })
  @ApiResponse({
    status: 200,
    description: "Document retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getDocument(@Param("id") id: string): Promise<any> {
    return this.searchService.getDocument(id);
  }

  @Put("documents/:id")
  @ApiOperation({
    summary: "Update a document",
    description: "Updates an existing document in the search index.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
  })
  @ApiResponse({
    status: 200,
    description: "Document updated successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        updated_at: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateDocument(
    @Param("id") id: string,
    @Body() dto: UpdateSearchDocumentDto,
  ): Promise<UpdateDocumentResponse> {
    return this.searchService.updateDocument(id, dto);
  }

  @Delete("documents/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a document",
    description: "Removes a document from the search index.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Document identifier",
  })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteDocument(@Param("id") id: string): Promise<void> {
    await this.searchService.deleteDocument(id);
  }

  @Get("health")
  @ApiOperation({
    summary: "Health check",
    description: "Check if the search API is running and healthy.",
  })
  @ApiResponse({
    status: 200,
    description: "Search API is healthy",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        timestamp: { type: "string" },
        status: { type: "string" },
      },
    },
  })
  async healthCheck(): Promise<any> {
    return {
      success: true,
      message: "Search API is running",
      timestamp: new Date().toISOString(),
      status: "healthy",
    };
  }

  @Get("health/typesense")
  @ApiOperation({
    summary: "Typesense health check",
    description: "Check if the Typesense connection is healthy.",
  })
  @ApiResponse({
    status: 200,
    description: "Typesense connection is healthy",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        timestamp: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Typesense connection failed",
  })
  async typesenseHealthCheck(): Promise<any> {
    try {
      await this.searchService.healthCheck();
      return {
        success: true,
        message: "Typesense connection is healthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Typesense connection failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("status/collection")
  @ApiOperation({
    summary: "Collection status check",
    description: "Check the status of the Typesense collection.",
  })
  @ApiResponse({
    status: 200,
    description: "Collection is available",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        collection: {
          type: "object",
          properties: {
            name: { type: "string" },
            num_documents: { type: "number" },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                },
              },
            },
          },
        },
        timestamp: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Collection not found or error accessing collection",
  })
  async getCollectionStatus(): Promise<any> {
    try {
      const collection = await this.searchService.getCollectionStatus();
      return {
        success: true,
        message: "Collection is available",
        collection,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Collection not found or error accessing collection",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("test/search")
  @ApiOperation({
    summary: "Simple test search",
    description: "Perform a simple test search for easy browser testing.",
  })
  @ApiQuery({
    name: "q",
    required: false,
    type: "string",
    description: "Search query",
    example: "test",
  })
  @ApiResponse({
    status: 200,
    description: "Test search results",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        query: { type: "string" },
        results: { type: "object" },
        timestamp: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Test search failed",
  })
  async testSearch(@Query("q") query?: string): Promise<any> {
    try {
      const searchQuery = query || "test";
      const results = await this.searchService.searchDocuments({
        query: searchQuery,
        // searchType is now controlled via ENV variable, not DTO
        limit: 5,
      });

      return {
        success: true,
        query: searchQuery,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Test search failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("debug/config")
  @ApiOperation({
    summary: "Test ConfigService values",
    description: "Debug endpoint to verify ConfigService is reading SEARCH_PARAM_* environment variables correctly.",
  })
  @ApiResponse({
    status: 200,
    description: "ConfigService values for SEARCH_PARAM_* configuration",
  })
  async testConfig(): Promise<any> {
    try {
      // Helper function to compare ConfigService vs process.env
      const compareValue = (configValue: any, envKey: string) => {
        const envValue = process.env[envKey];
        const envStr = envValue !== undefined && envValue !== "" ? envValue : undefined;
        
        return {
          configService: configValue, // Keep original type (number, boolean, string, undefined)
          processEnv: envStr,
        };
      };

      // Search Parameters (SEARCH_PARAM_* only)
      const searchParams = {
        searchType: compareValue(
          this.configService.getSearchParamSearchType(),
          "SEARCH_PARAM_SEARCH_TYPE"
        ),
        hybridAlpha: compareValue(
          this.configService.getSearchParamHybridAlpha(),
          "SEARCH_PARAM_HYBRID_ALPHA"
        ),
        prioritizeExactMatch: compareValue(
          this.configService.getSearchParamPrioritizeExactMatch(),
          "SEARCH_PARAM_PRIORITIZE_EXACT_MATCH"
        ),
        numTypos: compareValue(
          this.configService.getSearchParamNumTypos(),
          "SEARCH_PARAM_NUM_TYPOS"
        ),
        efMultiplier: compareValue(
          this.configService.getSearchParamEfMultiplier(),
          "SEARCH_PARAM_EF_MULTIPLIER"
        ),
        flatSearchCutoff: compareValue(
          this.configService.getSearchParamFlatSearchCutoff(),
          "SEARCH_PARAM_FLAT_SEARCH_CUTOFF"
        ),
        distanceThreshold: compareValue(
          this.configService.getSearchParamDistanceThreshold(),
          "SEARCH_PARAM_DISTANCE_THRESHOLD"
        ),
      };

      return {
        success: true,
        timestamp: new Date().toISOString(),
        search: searchParams,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Config test failed",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

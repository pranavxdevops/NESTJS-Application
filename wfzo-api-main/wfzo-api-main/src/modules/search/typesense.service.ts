import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@shared/config/config.service";
import Typesense from "typesense";
import { EmbeddingService } from "./embedding.service";
import { SearchType } from "./dto/search.dto";

@Injectable()
export class TypesenseService {
  private readonly logger = new Logger(TypesenseService.name);
  private readonly typesense: any;
  private readonly collectionName: string;
  private collectionInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.collectionName = this.configService.getTypesenseCollection();

    this.typesense = new Typesense.Client({
      nodes: [
        {
          host: this.configService.getTypesenseHost(),
          port: parseInt(this.configService.getTypesensePort()),
          protocol: this.configService.getTypesenseProtocol(),
        },
      ],
      apiKey: this.configService.getTypesenseApiKey(),
      connectionTimeoutSeconds: 2,
    });
  }

  async ensureCollectionExists(): Promise<void> {
    if (this.collectionInitialized) {
      return;
    }

    try {
      // Check if collection exists
      await this.typesense.collections(this.collectionName).retrieve();
      this.logger.log(`Collection "${this.collectionName}" already exists`);
      this.collectionInitialized = true;
    } catch (error: any) {
      if (error.httpStatus === 404) {
        // Create collection if it doesn't exist
        await this.createCollection();
        this.collectionInitialized = true;
      } else {
        this.logger.error("Error checking collection:", error);
        throw error;
      }
    }
  }

  async createCollection(): Promise<void> {
    try {
      const schema = {
        name: this.collectionName,
        fields: [
          { name: "id", type: "string" },
          { name: "title", type: "string" },
          { name: "content", type: "string" },
          { name: "category", type: "string", facet: true, optional: true },
          { name: "tags", type: "string[]", facet: true, optional: true },
          { name: "embedding", type: "float[]", num_dim: 1536, optional: true },
          { name: "created_at", type: "int64" },
          { name: "updated_at", type: "int64" },
        ],
      };

      await this.typesense.collections().create(schema);
      this.logger.log(`Collection "${this.collectionName}" created successfully`);
    } catch (error) {
      this.logger.error("Error creating collection:", error);
      throw error;
    }
  }

  async indexDocument(document: {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<any> {
    try {
      // Ensure collection exists before indexing
      await this.ensureCollectionExists();

      // Generate embedding for the content
      const embedding = await this.embeddingService.generateEmbedding(
        `${document.title} ${document.content}`,
      );

      const doc = {
        id: document.id,
        title: document.title,
        content: document.content,
        category: document.category || "",
        tags: document.tags || [],
        embedding: embedding,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const result = await this.typesense.collections(this.collectionName).documents().create(doc);

      return result;
    } catch (error) {
      this.logger.error("Error indexing document:", error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    options: {
      // Core search parameters (commonly used, have defaults)
      searchType?: SearchType;
      limit?: number;
      offset?: number;
      filters?: string;
      facets?: string;
      // Hybrid search parameter (only used when searchType === HYBRID, ignored for SEMANTIC)
      hybridAlpha?: number;
      // Vector/semantic search parameters (have defaults, used for SEMANTIC and HYBRID)
      efMultiplier?: number; // Multiplier for ef calculation: ef = efMultiplier * limit (default: 3, meaning ef = 3 * limit)
      flatSearchCutoff?: number;
      // Strictly optional - if not provided, Typesense returns best K matches adaptively without distance filtering
      // Only used for SEMANTIC and HYBRID search types
      distanceThreshold?: number | undefined;
      // Search quality parameters
      prioritizeExactMatch?: boolean; // Prioritize exact matches (default: true)
      numTypos?: number; // Number of typos allowed (default: 2)
      includeFields?: string; // Fields to include in response (comma-separated)
      excludeFields?: string; // Fields to exclude from response (comma-separated)
    } = {},
  ): Promise<any> {
    try {
      // Ensure collection exists before searching
      await this.ensureCollectionExists();

      // Get defaults from environment variables via config service
      const defaultSearchType = this.configService.getSearchParamSearchType();
      const defaultHybridAlpha = this.configService.getSearchParamHybridAlpha();
      const defaultPrioritizeExactMatch = this.configService.getSearchParamPrioritizeExactMatch();
      const defaultNumTypos = this.configService.getSearchParamNumTypos();
      const defaultEfMultiplier = this.configService.getSearchParamEfMultiplier();
      const defaultFlatSearchCutoff = this.configService.getSearchParamFlatSearchCutoff();
      const defaultDistanceThreshold = this.configService.getSearchParamDistanceThreshold();
      /*
      // Debug: Log the value we're getting from ConfigService - use console.error to ensure it appears
      console.error(`[DEBUG] defaultDistanceThreshold from ConfigService: ${defaultDistanceThreshold}, process.env: ${process.env.SEARCH_PARAM_DISTANCE_THRESHOLD}`);
      */
     
      // Map string search type from env to enum
      const getSearchTypeFromString = (type: string): SearchType => {
        const upperType = type.toUpperCase();
        if (upperType === "KEYWORD") return SearchType.KEYWORD;
        if (upperType === "HYBRID") return SearchType.HYBRID;
        return SearchType.SEMANTIC; // Default to semantic
      };

      const {
        // Core search parameters
        searchType = getSearchTypeFromString(defaultSearchType),
        limit = 10,
        offset = 0,
        filters = "",
        facets = "",
        // Hybrid search parameter
        hybridAlpha = defaultHybridAlpha, // Default from env: SEARCH_PARAM_HYBRID_ALPHA (70% weight to vector/semantic search, 30% to keyword in hybrid, only used when searchType === HYBRID)
        // Vector search parameters
        efMultiplier = defaultEfMultiplier, // Default from env: SEARCH_PARAM_EF_MULTIPLIER (ef = efMultiplier * limit, so ef = 3 * limit for optimal recall)
        flatSearchCutoff = defaultFlatSearchCutoff, // Default from env: SEARCH_PARAM_FLAT_SEARCH_CUTOFF (use exact search for small result sets)
        // Strictly optional - if not provided, Typesense returns best K matches adaptively without distance filtering
        // If provided via env or options, filters results to only include documents within this distance threshold
        distanceThreshold: providedDistanceThreshold,
        // Search quality parameters
        prioritizeExactMatch = defaultPrioritizeExactMatch, // Default from env: SEARCH_PARAM_PRIORITIZE_EXACT_MATCH
        numTypos = defaultNumTypos, // Default from env: SEARCH_PARAM_NUM_TYPOS
        includeFields,
        excludeFields,
      } = options;

      let searchResults;

      if (searchType === SearchType.KEYWORD) {
        // Pure keyword search (most reliable)
        // NOTE: highlight_fields and snippet_fields are NOT used for any search type:
        // - For semantic search: No text query to match, so no highlights possible
        // - For hybrid search: Highlights only appear when there's a text match (30% weight),
        //   but results can be ranked by vector similarity (70% weight) without text matches.
        //   This means many results won't have highlights, making these fields not meaningful.
        // - For keyword search: While highlights would work, we avoid using them for consistency
        //   across all search types and to avoid unnecessary processing.
        const keywordSearchConfig: any = {
          q: query,
          query_by: "title,content",
          filter_by: filters || undefined,
          facet_by: facets || undefined,
          per_page: limit,
          page: Math.floor(offset / limit) + 1,
          sort_by: "_text_match:desc",
          prioritize_exact_match: prioritizeExactMatch,
          num_typos: numTypos,
          // highlight_fields: "title,content", // NOT USED - see comment above
          // snippet_fields: "content", // NOT USED - see comment above
        };
        
        if (includeFields) {
          keywordSearchConfig.include_fields = includeFields;
        }
        if (excludeFields) {
          keywordSearchConfig.exclude_fields = excludeFields;
        }
        
        searchResults = await this.typesense
          .collections(this.collectionName)
          .documents()
          .search(keywordSearchConfig);
      } else if (searchType === SearchType.SEMANTIC || searchType === SearchType.HYBRID) {
        try {
          // Generate embedding for search query (1536 dimensions)
          // The user's query IS used here - it's converted to an embedding for semantic search
          const queryEmbedding = await this.embeddingService.generateEmbedding(query);

          // NOTE: highlight_fields and snippet_fields are NOT used for any search type:
          // - For semantic search: No text query to match, so no highlights possible
          // - For hybrid search: Highlights only appear when there's a text match (30% weight),
          //   but results can be ranked by vector similarity (70% weight) without text matches.
          //   This means many results won't have highlights, making these fields not meaningful.
          const searchConfig: any = {
            // For semantic search: q="*" disables keyword matching (we only want vector search)
            // For hybrid search: q=query enables keyword matching (combined with vector search)
            q: searchType === SearchType.SEMANTIC ? "*" : query,
            filter_by: filters || undefined,
            facet_by: facets || undefined,
            per_page: limit,
            page: Math.floor(offset / limit) + 1,
            prioritize_exact_match: prioritizeExactMatch,
            num_typos: numTypos,
            // highlight_fields: "title,content", // NOT USED - see comment above
            // snippet_fields: "content", // NOT USED - see comment above
          };
          
          if (includeFields) {
            searchConfig.include_fields = includeFields;
          }
          if (excludeFields) {
            searchConfig.exclude_fields = excludeFields;
          }

          // For hybrid search, add keyword search parameters
          if (searchType === SearchType.HYBRID) {
            searchConfig.query_by = "title,content";
            searchConfig.alpha = hybridAlpha; // Balance between vector (hybridAlpha) and keyword (1-hybridAlpha) search
          }

          // For semantic search, sort by vector distance (ascending = most similar first)
          if (searchType === SearchType.SEMANTIC) {
            searchConfig.sort_by = "_vector_distance:asc";
          } else {
            // Hybrid search uses combined ranking
            searchConfig.sort_by = "_text_match:desc";
          }

          // Try vector search using multiSearch to handle large payloads (>4000 chars)
          try {
            // Build vector query with configurable parameters
            // Format: embedding:([vector], k:limit[, distance_threshold:threshold])
            // Use provided distanceThreshold from options, or fall back to env default
            const finalDistanceThreshold = providedDistanceThreshold !== undefined 
              ? providedDistanceThreshold 
              : defaultDistanceThreshold;
            
            /*
            // Log distance threshold configuration for debugging
            this.logger.error('[TYPESENSE] Distance threshold configuration:', {
              providedDistanceThreshold,
              defaultDistanceThreshold,
              finalDistanceThreshold,
              envValue: process.env.SEARCH_PARAM_DISTANCE_THRESHOLD,
              configServiceValue: this.configService.getSearchParamDistanceThreshold(),
            });
            */
            
            let vectorQuery = `embedding:([${queryEmbedding.join(',')}], k:${limit})`;
            // distance_threshold is optional - if omitted, returns best K matches adaptively
            if (finalDistanceThreshold !== undefined && finalDistanceThreshold !== null) {
              vectorQuery += `, distance_threshold:${finalDistanceThreshold}`;
              this.logger.error('[TYPESENSE] Distance threshold APPLIED to vector query:', {
                threshold: finalDistanceThreshold,
                vectorQueryLength: vectorQuery.length,
                vectorQueryEnd: vectorQuery.substring(vectorQuery.length - 50),
              });
            } else {
              this.logger.error('[TYPESENSE] No distance threshold applied (using adaptive K matches)', {
                finalDistanceThreshold,
                defaultDistanceThreshold,
                providedDistanceThreshold,
              });
            }
            searchConfig.vector_query = vectorQuery;
            
            // Calculate ef from multiplier: ef = efMultiplier * limit
            // This ensures ef scales with the number of results requested
            // Default multiplier of 3 means ef = 3 * limit (e.g., for 10 results, ef = 30)
            const ef = Math.round(efMultiplier * limit);
            if (ef > 0) {
              searchConfig.ef = ef;
            }
            
            // Add flat_search_cutoff for exact search on small result sets
            // If results < cutoff, uses exact search instead of approximate
            if (flatSearchCutoff > 0) {
              searchConfig.flat_search_cutoff = flatSearchCutoff;
            }

            // Use multiSearch to handle large vector query payloads (>4000 chars)
            // multiSearch uses POST to /multi_search endpoint which doesn't have query string length limits
            const multiSearchRequest = {
              searches: [
                {
                  collection: this.collectionName,
                  ...searchConfig,
                },
              ],
            };

            const multiSearchResponse = await this.typesense.multiSearch.perform(
              multiSearchRequest,
              {
                cacheSearchResults: false,
                useServerSideSearchCache: false,
              },
            );

            // Extract the first (and only) result from multiSearch response
            if (
              !multiSearchResponse ||
              !multiSearchResponse.results ||
              multiSearchResponse.results.length === 0
            ) {
              throw new Error("MultiSearch returned no results");
            }

            const firstResult = multiSearchResponse.results[0];

            // Check if there was an error in the result
            if (firstResult.error) {
              throw new Error(
                `MultiSearch error: ${firstResult.error} - ${JSON.stringify(firstResult)}`,
              );
            }

            // Use the result from multiSearch
            searchResults = firstResult;
          } catch (vectorError: any) {
            this.logger.warn(
              "Vector search failed, using keyword search as fallback",
              {
                error: vectorError?.message || "Unknown error",
                httpStatus: vectorError?.httpStatus,
                name: vectorError?.name,
              },
            );
            // Fallback to keyword search
            // NOTE: highlight_fields and snippet_fields are NOT used - see comment at KEYWORD search config
            const fallbackSearchConfig: any = {
              q: query,
              query_by: "title,content",
              filter_by: filters || undefined,
              facet_by: facets || undefined,
              per_page: limit,
              page: Math.floor(offset / limit) + 1,
              sort_by: "_text_match:desc",
              prioritize_exact_match: prioritizeExactMatch,
              num_typos: numTypos,
              // highlight_fields: "title,content", // NOT USED - see comment at KEYWORD search config
              // snippet_fields: "content", // NOT USED - see comment at KEYWORD search config
            };
            
            if (includeFields) {
              fallbackSearchConfig.include_fields = includeFields;
            }
            if (excludeFields) {
              fallbackSearchConfig.exclude_fields = excludeFields;
            }
            
            searchResults = await this.typesense
              .collections(this.collectionName)
              .documents()
              .search(fallbackSearchConfig);
          }
        } catch (embeddingError) {
          this.logger.warn("Embedding generation failed, using keyword search", embeddingError);
          // Fallback to keyword search if embedding fails
          // NOTE: highlight_fields and snippet_fields are NOT used - see comment at KEYWORD search config
          const embeddingFallbackConfig: any = {
            q: query,
            query_by: "title,content",
            filter_by: filters || undefined,
            facet_by: facets || undefined,
            per_page: limit,
            page: Math.floor(offset / limit) + 1,
            sort_by: "_text_match:desc",
            prioritize_exact_match: prioritizeExactMatch,
            num_typos: numTypos,
            // highlight_fields: "title,content", // NOT USED - see comment at KEYWORD search config
            // snippet_fields: "content", // NOT USED - see comment at KEYWORD search config
          };
          
          if (includeFields) {
            embeddingFallbackConfig.include_fields = includeFields;
          }
          if (excludeFields) {
            embeddingFallbackConfig.exclude_fields = excludeFields;
          }
          
          searchResults = await this.typesense
            .collections(this.collectionName)
            .documents()
            .search(embeddingFallbackConfig);
        }
      }

      return {
        hits: searchResults.hits.map((hit: any) => ({
          id: hit.document.id,
          title: hit.document.title,
          content: hit.document.content,
          category: hit.document.category,
          tags: hit.document.tags,
          score: hit.text_match_info?.score || hit.vector_distance || 0,
          snippet: this.generateSnippet(hit),
        })),
        found: searchResults.found,
        search_time_ms: searchResults.search_time_ms,
        facet_counts: searchResults.facet_counts || [],
        search_type_used: searchType,
      };
    } catch (error) {
      this.logger.error("Error searching documents:", error);
      throw error;
    }
  }

  private generateSnippet(hit: any): string {
    if (hit.highlights && hit.highlights.length > 0) {
      return hit.highlights[0].snippet || "";
    }
    return hit.document.content.substring(0, 200) + "...";
  }

  async getDocument(id: string): Promise<any> {
    try {
      const document = await this.typesense
        .collections(this.collectionName)
        .documents(id)
        .retrieve();

      return document;
    } catch (error) {
      this.logger.error("Error retrieving document:", error);
      throw error;
    }
  }

  async updateDocument(id: string, updates: any): Promise<any> {
    try {
      // If content or title is being updated, regenerate embedding
      if (updates.title || updates.content) {
        const document = await this.getDocument(id);
        const newContent = `${updates.title || document.title} ${
          updates.content || document.content
        }`;
        updates.embedding = await this.embeddingService.generateEmbedding(newContent);
      }

      updates.updated_at = Date.now();

      const result = await this.typesense
        .collections(this.collectionName)
        .documents(id)
        .update(updates);

      return result;
    } catch (error) {
      this.logger.error("Error updating document:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    try {
      await this.typesense.collections(this.collectionName).documents(id).delete();

      return { success: true };
    } catch (error) {
      this.logger.error("Error deleting document:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<any> {
    try {
      return await this.typesense.health.retrieve();
    } catch (error) {
      this.logger.error("Typesense health check failed:", error);
      throw error;
    }
  }

  async getCollectionStatus(): Promise<any> {
    try {
      const collection = await this.typesense.collections(this.collectionName).retrieve();
      return {
        name: collection.name,
        num_documents: collection.num_documents,
        fields: collection.fields.map((f: any) => ({ name: f.name, type: f.type })),
      };
    } catch (error) {
      this.logger.error("Error getting collection status:", error);
      throw error;
    }
  }
}

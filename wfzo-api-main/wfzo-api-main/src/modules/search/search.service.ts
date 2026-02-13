import { Injectable, NotFoundException } from "@nestjs/common";
import { TypesenseService } from "./typesense.service";
import { SearchDocumentRepository } from "./repository/search-document.repository";
import {
  CreateSearchDocumentDto,
  SearchDocumentsDto,
  UpdateSearchDocumentDto,
  SearchResults,
  CreateDocumentResponse,
  UpdateDocumentResponse,
} from "./dto/search.dto";
import { randomUUID } from "node:crypto";

@Injectable()
export class SearchService {
  constructor(
    private readonly typesenseService: TypesenseService,
    private readonly searchDocumentRepository: SearchDocumentRepository,
  ) {}

  async createDocument(dto: CreateSearchDocumentDto): Promise<CreateDocumentResponse> {
    const document = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      category: dto.category,
      tags: dto.tags || [],
    };

    const result = await this.typesenseService.indexDocument(document);

    // Also store in MongoDB for backup/reference
    await this.searchDocumentRepository.create({
      ...document,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return {
      id: result.id,
      title: result.title,
      content: result.content,
      category: result.category,
      tags: result.tags,
      created_at: result.created_at,
    };
  }

  async searchDocuments(dto: SearchDocumentsDto): Promise<SearchResults> {
    // Build filters
    const filters: string[] = [];
    if (dto.category) {
      filters.push(`category:=${dto.category}`);
    }
    if (dto.tags && dto.tags.length > 0) {
      filters.push(`tags:[${dto.tags.join(",")}]`);
    }

    const filterString = filters.join(" && ");

    const results = await this.typesenseService.searchDocuments(dto.query, {
      // searchType, hybridAlpha, prioritizeExactMatch, numTypos are now controlled via ENV
      // typesenseService will use ENV defaults automatically
      limit: Math.min(dto.limit || 10, 100), // Cap at 100
      offset: dto.offset || 0,
      filters: filterString,
      facets: "category,tags",
      includeFields: dto.includeFields,
      excludeFields: dto.excludeFields,
    });

    return results;
  }

  async getDocument(id: string): Promise<any> {
    try {
      const document = await this.typesenseService.getDocument(id);
      return document;
    } catch (error: any) {
      if (error.httpStatus === 404) {
        throw new NotFoundException("Document not found");
      }
      throw error;
    }
  }

  async updateDocument(id: string, dto: UpdateSearchDocumentDto): Promise<UpdateDocumentResponse> {
    try {
      const result = await this.typesenseService.updateDocument(id, dto);

      // Also update in MongoDB
      await this.searchDocumentRepository.updateOne(
        { id },
        {
          ...dto,
          updated_at: Date.now(),
        },
      );

      return {
        id: result.id,
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        updated_at: result.updated_at,
      };
    } catch (error: any) {
      if (error.httpStatus === 404) {
        throw new NotFoundException("Document not found");
      }
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    try {
      await this.typesenseService.deleteDocument(id);

      // Also delete from MongoDB
      await this.searchDocumentRepository.deleteOne({ id });

      return { success: true };
    } catch (error: any) {
      if (error.httpStatus === 404) {
        throw new NotFoundException("Document not found");
      }
      throw error;
    }
  }

  async healthCheck(): Promise<any> {
    return await this.typesenseService.healthCheck();
  }

  async getCollectionStatus(): Promise<any> {
    return await this.typesenseService.getCollectionStatus();
  }
}

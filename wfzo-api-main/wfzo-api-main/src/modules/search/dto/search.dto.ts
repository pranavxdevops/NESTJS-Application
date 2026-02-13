import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export enum SearchType {
  KEYWORD = "keyword",
  SEMANTIC = "semantic",
  HYBRID = "hybrid",
}

export class CreateSearchDocumentDto {
  @ApiProperty({
    description: "Title of the document",
    example: "Introduction to Machine Learning",
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: "Content of the document",
    example: "Machine learning is a subset of artificial intelligence...",
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: "Category of the document",
    example: "Technology",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Tags associated with the document",
    example: ["AI", "ML", "Technology"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchDocumentsDto {
  @ApiProperty({
    description: "Search query",
    example: "machine learning algorithms",
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: "Maximum number of results to return",
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Number of results to skip for pagination",
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: "Filter by category",
    example: "Technology",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Filter by tags",
    example: ["AI", "ML"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Fields to include in the response (comma-separated)",
    example: "id,title,content",
  })
  @IsOptional()
  @IsString()
  includeFields?: string;

  @ApiPropertyOptional({
    description: "Fields to exclude from the response (comma-separated)",
    example: "embedding",
  })
  @IsOptional()
  @IsString()
  excludeFields?: string;
}

export class UpdateSearchDocumentDto {
  @ApiPropertyOptional({
    description: "Title of the document",
    example: "Updated Introduction to Machine Learning",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "Content of the document",
    example: "Updated content about machine learning...",
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: "Category of the document",
    example: "Technology",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Tags associated with the document",
    example: ["AI", "ML", "Technology"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export interface SearchDocumentResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  score: number;
  snippet: string;
}

export interface SearchResults {
  hits: SearchDocumentResponse[];
  found: number;
  search_time_ms: number;
  facet_counts?: any[];
  search_type_used: SearchType;
}

export interface CreateDocumentResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  created_at: number;
}

export interface UpdateDocumentResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  updated_at: number;
}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@shared/config/config.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { TypesenseService } from "./typesense.service";
import { EmbeddingService } from "./embedding.service";
import { SearchDocument, SearchDocumentSchema } from "./schemas/search-document.schema";
import { SearchDocumentRepository } from "./repository/search-document.repository";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: SearchDocument.name, schema: SearchDocumentSchema }]),
  ],
  controllers: [SearchController],
  providers: [SearchService, TypesenseService, EmbeddingService, SearchDocumentRepository],
  exports: [SearchService, TypesenseService, EmbeddingService],
})
export class SearchModule {}

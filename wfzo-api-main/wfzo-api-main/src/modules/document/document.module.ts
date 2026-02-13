import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { DocumentRepository } from "./repository/document.repository";
import { Document, DocumentSchema } from "./schemas/document.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }])],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository],
  exports: [DocumentService, DocumentRepository],
})
export class DocumentModule {}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { SearchDocument, SearchDocumentDocument } from "../schemas/search-document.schema";

@Injectable()
export class SearchDocumentRepository extends BaseRepository<SearchDocumentDocument> {
  constructor(
    @InjectModel(SearchDocument.name)
    private readonly searchDocumentModel: Model<SearchDocumentDocument>,
  ) {
    super(searchDocumentModel);
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Document, DocumentDocument } from "../schemas/document.schema";
import { BaseRepository } from "@shared/common/base.repository";

@Injectable()
export class DocumentRepository extends BaseRepository<Document> {
  constructor(@InjectModel(Document.name) model: Model<DocumentDocument>) {
    super(model as unknown as Model<Document>);
  }

  async findByBlobName(blobName: string): Promise<Document | null> {
    return this.model.findOne({ blobName }).lean().exec();
  }

  async findByPurpose(purpose: string, limit: number = 10): Promise<Document[]> {
    return this.model.find({ purpose }).limit(limit).sort({ createdAt: -1 }).lean().exec();
  }

  async findByMediaKind(
    mediaKind: "document" | "image" | "video",
    limit: number = 10,
  ): Promise<Document[]> {
    return this.model.find({ mediaKind }).limit(limit).sort({ createdAt: -1 }).lean().exec();
  }

  async updateStatus(
    id: string,
    status: "processing" | "ready" | "failed",
    message?: string,
  ): Promise<Document | null> {
    const update: Record<string, any> = { status };
    if (message !== undefined) {
      update.statusMessage = message;
    }
    return this.model.findOneAndUpdate({ id }, update, { new: true }).lean().exec();
  }

  async addVariant(
    id: string,
    variant: {
      key: string;
      url: string;
      contentType: string;
      width?: number;
      height?: number;
      bitrateKbps?: number;
      size?: number;
      ready?: boolean;
    },
  ): Promise<Document | null> {
    return this.model
      .findOneAndUpdate({ id }, { $push: { variants: variant } }, { new: true })
      .lean()
      .exec();
  }
}

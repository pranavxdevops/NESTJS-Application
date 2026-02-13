import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as MongooseDocument } from "mongoose";

export type DocumentDocument = Document & MongooseDocument;

export type MediaKind = "document" | "image" | "video";
export type DocumentVariantKey = "original" | "thumbnail" | "preview" | "hlsManifest";
export type DocumentStatus = "processing" | "ready" | "failed";

@Schema({ _id: false })
export class DocumentVariant {
  @Prop({ required: true, enum: ["original", "thumbnail", "preview", "hlsManifest"] })
  key!: DocumentVariantKey;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  contentType!: string;

  @Prop({ type: Number, required: false })
  width?: number;

  @Prop({ type: Number, required: false })
  height?: number;

  @Prop({ type: Number, required: false })
  bitrateKbps?: number;

  @Prop({ type: Number, required: false })
  size?: number;

  @Prop({ type: Boolean, default: true })
  ready!: boolean;
}

const DocumentVariantSchema = SchemaFactory.createForClass(DocumentVariant);

@Schema({ timestamps: true, collection: "documents" })
export class Document {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  contentType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true, enum: ["document", "image", "video"] })
  mediaKind!: MediaKind;

  @Prop({ required: false })
  purpose?: string;

  @Prop({ required: true })
  blobName!: string;

  @Prop({ required: true, enum: ["processing", "ready", "failed"], default: "processing" })
  status!: DocumentStatus;

  @Prop({ required: false })
  statusMessage?: string;

  @Prop({ type: [DocumentVariantSchema], default: [] })
  variants!: DocumentVariant[];

  @Prop({ required: false })
  uploadedBy?: string;

  @Prop({ type: Boolean, default: false })
  isPublic!: boolean;

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>;

  @Prop({ required: false, type: Date })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);

// Add indexes for common queries
// Unique indexes are created by migration 001-database-indexes.migration.ts
// DocumentSchema.index({ id: 1 }, { unique: true });
DocumentSchema.index({ mediaKind: 1, status: 1 });
DocumentSchema.index({ purpose: 1 });
DocumentSchema.index({ createdAt: -1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SearchDocumentDocument = SearchDocument & Document;

@Schema({ timestamps: true })
export class SearchDocument {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: false })
  category?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [Number], required: false })
  embedding?: number[];

  @Prop({ required: true })
  created_at!: number;

  @Prop({ required: true })
  updated_at!: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const SearchDocumentSchema = SchemaFactory.createForClass(SearchDocument);

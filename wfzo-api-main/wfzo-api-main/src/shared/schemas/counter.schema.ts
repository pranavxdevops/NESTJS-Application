import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Counter schema for auto-incrementing IDs
 * Used to generate sequential IDs for various entities
 */
@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true })
  name!: string; // e.g., "member", "invoice", etc.

  @Prop({ required: true, default: 0 })
  seq!: number; // Current sequence number
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

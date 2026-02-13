import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { v4 as uuid } from "uuid";

@Schema({ timestamps: true })
export class InternalUser {
  @Prop({ type: String, unique: true, index: true })
  id!: string; // UUID stable id exposed via API

  @Prop({ type: String, required: true, unique: true, index: true })
  email!: string;

  @Prop({ type: String })
  firstName?: string;

  @Prop({ type: String })
  lastName?: string;

  @Prop({ type: String })
  displayName?: string;

  @Prop({ type: [String], default: [] })
  roles!: string[]; // Role codes (e.g., ["ADMIN", "FINANCE"])

  @Prop({ type: String, enum: ["active", "disabled"], default: "active" })
  status!: "active" | "disabled";

  @Prop({ type: String })
  passwordHash?: string; // TODO: store hashed password

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type InternalUserDocument = HydratedDocument<InternalUser>;
export const InternalUserSchema = SchemaFactory.createForClass(InternalUser);

InternalUserSchema.pre("save", function (next) {
  if (!this.id) this.id = uuid();
  next();
});

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username!: string; // email format

  @Prop()
  password?: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ index: true })
  entraUserId?: string; // Microsoft Entra ID user object ID

  @Prop({ index: true })
  keycloakUserId?: string; // Keycloak user subject ID (sub claim)

  @Prop()
  memberId?: string; // uuid

  @Prop({ enum: ["Primary", "Secondry", "Non Member", "Internal"] })
  userType?: string;

  @Prop()
  isMember?: boolean;

  @Prop()
  newsLetterSubscription?: boolean;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  correspondanceUser?: boolean;

  @Prop()
  marketingFocalPoint?: boolean;

  @Prop()
  investorFocalPoint?: boolean;

  @Prop()
  designation?: string;

  @Prop()
  contactNumber?: string;

  @Prop()
  displayName?: string;

  @Prop()
  phone?: string;

  @Prop()
  title?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  location?: string;

  @Prop()
  industry?: string;

  @Prop({ enum: ["active", "inactive", "suspended"], default: "active" })
  status?: string;

  @Prop({ type: Object })
  preferences?: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Unique indexes are created by migration 001-database-indexes.migration.ts
// UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 });
UserSchema.index({ memberId: 1 });

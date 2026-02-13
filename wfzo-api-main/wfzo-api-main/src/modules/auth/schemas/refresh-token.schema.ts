import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

/**
 * RefreshToken Schema
 *
 * Stores refresh tokens for secure token rotation and revocation.
 * Supports industry-standard practices:
 * - Token rotation on each refresh
 * - Revocation capability
 * - Automatic expiry
 * - User session tracking
 */
@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, index: true })
  token!: string; // Hashed refresh token

  @Prop({ required: true, index: true })
  userId!: string; // Reference to User._id

  @Prop({ required: true })
  email!: string; // User email for quick lookup

  @Prop({ required: true })
  expiresAt!: Date; // Token expiration date

  @Prop({ default: false })
  revoked!: boolean; // Manual revocation flag

  @Prop()
  revokedAt?: Date; // When was it revoked

  @Prop()
  replacedBy?: string; // Token ID that replaced this (for rotation tracking)

  @Prop()
  userAgent?: string; // Browser/device info for security tracking

  @Prop()
  ipAddress?: string; // IP address for security tracking

  @Prop()
  createdAt?: Date; // Auto-managed by timestamps

  @Prop()
  updatedAt?: Date; // Auto-managed by timestamps
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes for performance
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ userId: 1, revoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

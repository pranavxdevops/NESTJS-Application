import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserBlockDocument = UserBlock & Document;

/**
 * UserBlock - Individual user-level blocking for chat
 * Blocks specific users from sending messages (internal & external)
 */
@Schema({ timestamps: true })
export class UserBlock {
  @Prop({ type: String, required: true, index: true })
  blockerId!: string; // User ID who blocked

  @Prop({ type: String, required: true, index: true })
  blockerMemberId!: string; // Blocker's member ID

  @Prop({ type: String, required: true, index: true })
  blockedUserId!: string; // User ID who is blocked

  @Prop({ type: String, required: true, index: true })
  blockedMemberId!: string; // Blocked user's member ID

  @Prop({ type: Date, default: () => new Date() })
  blockedAt!: Date; // When the block was created

  @Prop({ type: Boolean, default: true })
  isActive!: boolean; // Allow soft unblock
}

export const UserBlockSchema = SchemaFactory.createForClass(UserBlock);

// Compound index for efficient lookups - one user blocking another
UserBlockSchema.index({ 
  blockerId: 1, 
  blockedUserId: 1 
}, { unique: true });

// Index for checking if user is blocked by someone
UserBlockSchema.index({ blockedUserId: 1, isActive: 1 });

// Index for checking if blocker has blocked someone
UserBlockSchema.index({ blockerId: 1, isActive: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationPreferencesDocument = ConversationPreferences & Document;

/**
 * ConversationPreferences - User-specific preferences for conversations
 * Tracks starred conversations per user
 */
@Schema({ timestamps: true })
export class ConversationPreferences {
  @Prop({ type: String, required: true, index: true })
  userId!: string; // User ID who owns this preference

  @Prop({ type: String, required: true, index: true })
  memberId!: string; // User's member ID

  @Prop({ type: String, required: true, index: true })
  otherMemberId!: string; // The other member in conversation

  @Prop({ type: String, index: true })
  otherUserId?: string; // The other user (if User Chat)

  @Prop({ type: Boolean, default: false })
  isStarred!: boolean; // Whether conversation is starred

  @Prop({ type: Date })
  starredAt?: Date; // When it was starred
}

export const ConversationPreferencesSchema = SchemaFactory.createForClass(ConversationPreferences);

// Compound index for efficient lookups
ConversationPreferencesSchema.index({ 
  userId: 1, 
  memberId: 1, 
  otherMemberId: 1, 
  otherUserId: 1 
}, { unique: true });

ConversationPreferencesSchema.index({ userId: 1, isStarred: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, required: true })
  senderId!: string; // Member ID (e.g., MEMBER-001)

  @Prop({ type: String, required: true })
  recipientId!: string; // Member ID (e.g., MEMBER-002)

  @Prop({ type: String, required: false })
  senderUserId?: string; // User ID from userSnapshots (for User Chat)

  @Prop({ type: String, required: false })
  recipientUserId?: string; // User ID from userSnapshots (for User Chat)

  @Prop({ type: String, required: true })
  content!: string; // Text content or file name

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type!: MessageType; // Message type: text, image, document

  @Prop({ type: String })
  fileUrl?: string; // URL of uploaded file (for image/document types)

  @Prop({ type: String })
  fileName?: string; // Original file name

  @Prop({ type: Number })
  fileSize?: number; // File size in bytes

  @Prop({ type: String })
  mimeType?: string; // MIME type of the file

  @Prop({ type: Date })
  fileUrlExpiresAt?: Date; // When the signed URL for file expires

  @Prop({ type: Number })
  fileUrlExpiresIn?: number; // Seconds until signed URL expires

  @Prop({ type: Boolean, default: false })
  isRead!: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean; // Soft delete flag

  @Prop({ type: Date })
  deletedAt?: Date; // When message was deleted

  @Prop({ type: String })
  deletedBy?: string; // User ID who deleted the message

  @Prop({ type: Boolean, default: false })
  isBlockedMessage!: boolean; // True if sent while recipient had blocked sender (silent block)

  @Prop({ type: Date })
  blockedAt?: Date; // When message was marked as blocked
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for efficient queries
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, createdAt: -1 });

// Indexes for user-level chat queries
MessageSchema.index({ senderUserId: 1, recipientUserId: 1 });
MessageSchema.index({ senderUserId: 1 });
MessageSchema.index({ recipientUserId: 1 });

// Index for filtering deleted messages
MessageSchema.index({ isDeleted: 1 });
MessageSchema.index({ senderId: 1, recipientId: 1, isDeleted: 1 });

// Index for filtering blocked messages
MessageSchema.index({ isBlockedMessage: 1 });
MessageSchema.index({ recipientId: 1, recipientUserId: 1, isBlockedMessage: 1 });

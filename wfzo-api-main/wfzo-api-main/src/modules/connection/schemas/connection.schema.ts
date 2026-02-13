import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConnectionDocument = Connection & Document;

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true })
export class Connection {
  @Prop({ type: String, required: true })
  requesterId!: string; // Member ID who sent the connection request (e.g., MEMBER-001)

  @Prop({ type: String, required: true })
  recipientId!: string; // Member ID who receives the connection request (e.g., MEMBER-002)

  @Prop({
    type: String,
    enum: Object.values(ConnectionStatus),
    default: ConnectionStatus.PENDING,
  })
  status!: ConnectionStatus;

  @Prop({ type: Date })
  acceptedAt?: Date; // Timestamp when connection was accepted

  @Prop({ type: Date })
  rejectedAt?: Date; // Timestamp when connection was rejected

  @Prop({ type: Date })
  blockedAt?: Date; // Timestamp when connection was blocked

  @Prop({ type: String })
  note?: string; // Optional note from requester

  @Prop({ type: Boolean, default: false })
  canResend!: boolean; // Flag to allow re-sending after rejection

  @Prop({ type: String })
  blockedBy?: string; // Member ID who initiated the block (for member-level blocks)

  @Prop({
    type: [
      {
        blockerId: { type: String, required: true }, // User ID who blocked
        blockedUserId: { type: String, required: true }, // User ID who got blocked
        blockerMemberId: { type: String, required: true }, // Member ID of blocker
        blockedMemberId: { type: String, required: true }, // Member ID of blocked user
        blockedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
        isBlocker: { type: Boolean, default: false }, // TRUE = blocker (can't send), FALSE = blocked (can send but won't reach blocker)
        blockType: { type: String, enum: ['member-to-member', 'user-to-user'], required: false }, // Type of block
      },
    ],
    default: [],
  })
  blockedUsers?: Array<{
    blockerId: string;
    blockedUserId: string;
    blockerMemberId: string;
    blockedMemberId: string;
    blockedAt: Date;
    isActive: boolean;
    isBlocker: boolean; // Asymmetric soft block: blocker restricted, blocked unaware
    blockType?: 'member-to-member' | 'user-to-user'; // Type of block
  }>;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

// Indexes for efficient queries
ConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
ConnectionSchema.index({ recipientId: 1, status: 1 });
ConnectionSchema.index({ requesterId: 1, status: 1 });
ConnectionSchema.index({ status: 1, createdAt: -1 });

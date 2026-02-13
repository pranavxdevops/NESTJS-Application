import { Migration } from './migration.interface';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Message } from '../../modules/chat/schemas/message.schema';

export class AddBlockedMessageFieldsMigration implements Migration {
  name = '007-add-blocked-message-fields';
  private readonly logger = new Logger(AddBlockedMessageFieldsMigration.name);

  constructor(private readonly messageModel: Model<Message>) {}

  async up(): Promise<void> {
    this.logger.log('Starting AddBlockedMessageFields migration...');

    try {
      // Add isBlockedMessage and blockedAt fields to all existing messages
      // Default isBlockedMessage to false for all existing messages
      const result = await this.messageModel.updateMany(
        { isBlockedMessage: { $exists: false } },
        {
          $set: {
            isBlockedMessage: false,
          },
        }
      );

      this.logger.log(`Updated ${result.modifiedCount} messages with isBlockedMessage field`);

      // Create indexes for blocked messages
      await this.messageModel.collection.createIndex(
        { isBlockedMessage: 1 },
        { name: 'idx_message_blocked' }
      );
      await this.messageModel.collection.createIndex(
        { recipientId: 1, recipientUserId: 1, isBlockedMessage: 1 },
        { name: 'idx_message_recipient_blocked' }
      );

      this.logger.log('Created indexes for blocked messages');
      this.logger.log('AddBlockedMessageFields migration completed successfully');
    } catch (error) {
      this.logger.error('AddBlockedMessageFields migration failed', error);
      throw error;
    }
  }

  async down(): Promise<void> {
    this.logger.log('Rolling back AddBlockedMessageFields migration...');

    try {
      // Remove the fields
      await this.messageModel.updateMany(
        {},
        {
          $unset: {
            isBlockedMessage: '',
            blockedAt: '',
          },
        }
      );

      // Drop indexes
      await this.messageModel.collection.dropIndex('idx_message_blocked');
      await this.messageModel.collection.dropIndex('idx_message_recipient_blocked');

      this.logger.log('AddBlockedMessageFields migration rolled back successfully');
    } catch (error) {
      this.logger.error('AddBlockedMessageFields rollback failed', error);
      throw error;
    }
  }
}

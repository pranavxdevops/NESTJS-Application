import { Injectable, BadRequestException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { ConversationPreferences, ConversationPreferencesDocument } from './schemas/conversation-preferences.schema';
import { Member, MemberDocument } from '../member/schemas/member.schema';
import { Connection, ConnectionDocument, ConnectionStatus } from '../connection/schemas/connection.schema';
import { SendMessageDto, GetConversationsQueryDto, GetMessagesQueryDto } from './dto/chat.dto';
import { EmailService } from '../../shared/email/email.service';
import { EmailTemplateCode } from '../../shared/email/schemas/email-template.schema';
import { BlobStorageService } from '../../shared/blob/blob.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(ConversationPreferences.name)
    private conversationPreferencesModel: Model<ConversationPreferencesDocument>,
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>,
    private readonly emailService: EmailService,
    private readonly blobService: BlobStorageService,
  ) {}

  /**
   * Helper: Find member and user by email
   */
  private async findUserByEmail(email: string): Promise<{ member: MemberDocument; user: any; isPrimary: boolean }> {
    const member = await this.memberModel.findOne({
      'userSnapshots.email': email,
      status: 'active',
    });

    if (!member) {
      throw new NotFoundException('Member profile not found for this user');
    }

    const userSnapshot = member.userSnapshots?.find(u => u.email === email);
    if (!userSnapshot) {
      throw new NotFoundException('User not found in member');
    }

    const isPrimary = userSnapshot.userType === 'Primary';

    return { member, user: userSnapshot, isPrimary };
  }

  /**
   * Helper: Check if two members are connected
   */
  private async areMembersConnected(memberId1: string, memberId2: string): Promise<boolean> {
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: memberId1, recipientId: memberId2 },
        { requesterId: memberId2, recipientId: memberId1 },
      ],
      status: ConnectionStatus.ACCEPTED,
    });

    return !!connection;
  }

  /**
   * Send a message
   * ROUTING LOGIC:
   * - Primary ↔ Primary (both not providing userId) → Member Chat
   * - Any message involving Secondary user → User Chat
   * - Primary acting as user (providing userId) → User Chat
   */
  async sendMessage(email: string, dto: SendMessageDto): Promise<MessageDocument> {
    // Get sender info
    const senderData = await this.findUserByEmail(email);
    const senderId = senderData.member.memberId;
    const senderUserId = senderData.user.id;
    const senderIsPrimary = senderData.isPrimary;

    // Validate recipient member exists
    const recipientMember = await this.memberModel.findOne({ memberId: dto.recipientId });
    if (!recipientMember) {
      throw new NotFoundException('Recipient member not found');
    }

    // Authorization check
    if (senderId === dto.recipientId) {
      // Same member - internal team chat
      if (!dto.recipientUserId) {
        throw new BadRequestException('Cannot send message to yourself. Provide recipientUserId to chat with team members.');
      }
      // Allow internal team chat (same memberId, different users)
      if (dto.recipientUserId === senderUserId) {
        throw new BadRequestException('Cannot send message to yourself');
      }
    } else {
      // Different members - must be connected
      const connected = await this.areMembersConnected(senderId, dto.recipientId);
      if (!connected) {
        throw new ForbiddenException('You must be connected with this member to send messages');
      }
    }

    // Determine if this is User Chat or Member Chat
    let isUserChat = false;
    let recipientUserId: string | undefined;
    let recipientIsPrimary = true;

    if (dto.recipientUserId) {
      // Recipient user specified → User Chat
      const recipientUser = recipientMember.userSnapshots?.find(u => u.id === dto.recipientUserId);
      if (!recipientUser) {
        throw new NotFoundException('Recipient user not found in member userSnapshots');
      }
      recipientUserId = recipientUser.id;
      recipientIsPrimary = recipientUser.userType === 'Primary';
      isUserChat = true;
    } else if (!senderIsPrimary) {
      // Sender is Secondary → User Chat
      isUserChat = true;
      // If no recipientUserId provided, default to Primary user of recipient member
      const recipientPrimaryUser = recipientMember.userSnapshots?.find(u => u.userType === 'Primary');
      if (recipientPrimaryUser) {
        recipientUserId = recipientPrimaryUser.id;
      }
    }
    // else: Both Primary, no userId provided → Member Chat (isUserChat = false)

    // Check for user-level blocking (only for User Chat)
    // Silent block: Allow message to be sent but mark it as blocked
    let isBlockedMessage = false;
    if (isUserChat && recipientUserId) {
      // Check if recipient has blocked sender (one-way check)
      const recipientBlockedSender = await this.isBlockedByUser(senderUserId, recipientUserId);
      if (recipientBlockedSender) {
        isBlockedMessage = true;
        this.logger.log(`[User Chat] Silent block: Message from ${senderUserId} to ${recipientUserId} will be marked as blocked`);
      }
    }

    // Validate file metadata if message is not text
    if (dto.type && dto.type !== 'text') {
      if (!dto.fileUrl || !dto.fileName || !dto.mimeType) {
        throw new BadRequestException('File URL, file name, and MIME type are required for file messages');
      }
    }

    // Create message with proper routing fields
    const message = new this.messageModel({
      senderId,
      recipientId: dto.recipientId,
      senderUserId: isUserChat ? senderUserId : undefined,
      recipientUserId: isUserChat ? recipientUserId : undefined,
      content: dto.content,
      type: dto.type || 'text',
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      isRead: false,
      isBlockedMessage,
      blockedAt: isBlockedMessage ? new Date() : undefined,
    });

    const savedMessage = await message.save();
    
    const chatType = isUserChat ? 'User Chat' : 'Member Chat';
    const logContext = isUserChat 
      ? `from user ${senderUserId} to user ${recipientUserId}` 
      : `from member ${senderId} to member ${dto.recipientId}`;
    const blockInfo = isBlockedMessage ? ' [BLOCKED - NOT DELIVERED]' : '';
    this.logger.log(`[${chatType}] Message sent ${logContext}, type: ${dto.type || 'text'}${blockInfo}`);

    // Check if this is the first message in the conversation (new chat)
    // Count previous messages between these two parties
    const previousMessageCount = await this.messageModel.countDocuments({
      $or: [
        // Messages from sender to recipient
        {
          senderId,
          recipientId: dto.recipientId,
          ...(isUserChat && senderUserId && recipientUserId
            ? { senderUserId, recipientUserId }
            : {}),
        },
        // Messages from recipient to sender
        {
          senderId: dto.recipientId,
          recipientId: senderId,
          ...(isUserChat && senderUserId && recipientUserId
            ? { senderUserId: recipientUserId, recipientUserId: senderUserId }
            : {}),
        },
      ],
      _id: { $ne: savedMessage._id }, // Exclude the message we just saved
    });

    const isNewChat = previousMessageCount === 0;

    // Send email notification ONLY for new chats (first message) AND if message is not blocked
    if (isNewChat && !isBlockedMessage) {
      this.logger.log(`[${chatType}] New chat detected - sending email notification`);
      this.sendNewMessageEmail(
        senderData,
        recipientMember,
        recipientUserId,
        isUserChat,
        dto.content,
        dto.type || 'text'
      ).catch(error => {
        this.logger.error(`Failed to send email notification: ${error.message}`, error.stack);
      });
    } else if (isBlockedMessage) {
      this.logger.log(`[${chatType}] Message blocked - skipping email notification`);
    } else {
      this.logger.log(`[${chatType}] Existing chat - skipping email notification`);
    }

    return savedMessage;
  }

  /**
   * Get conversations list
   * RETURNS: Both Member Chat and User Chat conversations, clearly separated
   */
  async getConversations(
    email: string,
    query: GetConversationsQueryDto,
  ): Promise<{ conversations: any[]; total: number; page: number; pageSize: number }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;
    const currentIsPrimary = senderData.isPrimary;

    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const skip = (page - 1) * pageSize;

    // Find all conversations where current user participated
    const conversationsAgg = await this.messageModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true }, // Exclude deleted messages
          $or: [
            // Messages sent by current user (show all, including blocked ones they sent)
            { senderId: currentMemberId, senderUserId: currentUserId },
            // Messages received by current user (exclude blocked messages)
            { 
              recipientId: currentMemberId, 
              recipientUserId: currentUserId,
              isBlockedMessage: { $ne: true } // Silent block: recipient doesn't see blocked messages
            },
            // For Primary users, also include Member Chat (no userId fields)
            ...(currentIsPrimary ? [
              { senderId: currentMemberId, senderUserId: { $exists: false } },
              { recipientId: currentMemberId, recipientUserId: { $exists: false } }
            ] : []),
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            memberId: {
              $cond: [
                { $eq: ['$senderId', currentMemberId] },
                '$recipientId',
                '$senderId',
              ],
            },
            userId: {
              $cond: [
                { $eq: ['$senderId', currentMemberId] },
                { $ifNull: ['$recipientUserId', null] },
                { $ifNull: ['$senderUserId', null] },
              ],
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', currentMemberId] },
                    {
                      $or: [
                        { $eq: ['$recipientUserId', currentUserId] },
                        { $eq: [{ $ifNull: ['$recipientUserId', null] }, null] },
                      ],
                    },
                    { $eq: ['$isRead', false] },
                    { $ne: ['$isBlockedMessage', true] }, // Don't count blocked messages in unread
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);

    // Get total count
    const totalAgg = await this.messageModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true }, // Exclude deleted messages
          $or: [
            // Messages sent by current user (show all, including blocked ones they sent)
            { senderId: currentMemberId, senderUserId: currentUserId },
            // Messages received by current user (exclude blocked messages)
            { 
              recipientId: currentMemberId, 
              recipientUserId: currentUserId,
              isBlockedMessage: { $ne: true } // Silent block: recipient doesn't see blocked messages
            },
            ...(currentIsPrimary ? [
              { senderId: currentMemberId, senderUserId: { $exists: false } },
              { recipientId: currentMemberId, recipientUserId: { $exists: false } }
            ] : []),
          ],
        },
      },
      {
        $group: {
          _id: {
            memberId: {
              $cond: [
                { $eq: ['$senderId', currentMemberId] },
                '$recipientId',
                '$senderId',
              ],
            },
            userId: {
              $cond: [
                { $eq: ['$senderId', currentMemberId] },
                { $ifNull: ['$recipientUserId', null] },
                { $ifNull: ['$senderUserId', null] },
              ],
            },
          },
        },
      },
      {
        $count: 'total',
      },
    ]);

    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

    // Populate member and user details
    const conversations = await Promise.all(
      conversationsAgg.map(async (conv) => {
        const otherMemberId = conv._id.memberId;
        const otherUserId = conv._id.userId;
        const isUserChat = otherUserId !== null;
        
        const otherMember = await this.memberModel
          .findOne({ memberId: otherMemberId })
          .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl organisationInfo.address userSnapshots')
          .lean();

        // Get starred status for this conversation
        const isStarred = await this.getStarredStatus(
          currentUserId,
          currentMemberId,
          otherMemberId,
          otherUserId
        );

        // Get blocking status
        let blockStatus = null;
        if (isUserChat && otherUserId) {
          // User Chat - check user-level blocking
          const [iBlockedThem, theyBlockedMe] = await Promise.all([
            this.hasBlockedUser(currentUserId, otherUserId),
            this.isBlockedByUser(currentUserId, otherUserId),
          ]);
          
          blockStatus = {
            isBlocked: iBlockedThem || theyBlockedMe,  // Either blocked
            iBlockedThem,                              // Current user blocked the other
            theyBlockedMe,                             // Other user blocked current user
          };
        } else {
          // Member Chat - check member-level blocking
          const [iBlockedThem, theyBlockedMe] = await Promise.all([
            this.hasBlockedMember(currentMemberId, otherMemberId),
            this.isBlockedByMember(currentMemberId, otherMemberId),
          ]);
          
          blockStatus = {
            isBlocked: iBlockedThem || theyBlockedMe,  // Either blocked
            iBlockedThem,                              // Current member blocked the other
            theyBlockedMe,                             // Other member blocked current member
          };
        }

        // If User Chat, find user details
        let userDetails = null;
        if (isUserChat && otherMember?.userSnapshots) {
          const userSnapshot = otherMember.userSnapshots.find(u => u.id === otherUserId);
          if (userSnapshot) {
            userDetails = {
              userId: userSnapshot.id,
              firstName: userSnapshot.firstName,
              lastName: userSnapshot.lastName,
              email: userSnapshot.email,
              userType: userSnapshot.userType,
              profileImageUrl: userSnapshot.profileImageUrl,
            };
          }
        }

        // Generate signed URL for lastMessage file attachment if present
        let fileUrl = conv.lastMessage.fileUrl;
        let fileUrlExpiresAt = conv.lastMessage.fileUrlExpiresAt;
        let fileUrlExpiresIn = conv.lastMessage.fileUrlExpiresIn;
        
        if (fileUrl && conv.lastMessage.type !== 'text') {
          try {
            const blobPath = this.blobService.extractBlobPath(fileUrl);
            
            // Always generate fresh signed URL with 12-hour expiry
            const signedUrlData = this.blobService.getSignedUrlWithMetadata(blobPath, 43200);
            fileUrl = signedUrlData.url;
            fileUrlExpiresAt = signedUrlData.expiresAt;
            fileUrlExpiresIn = signedUrlData.expiresIn;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to generate signed URL for last message in conversation: ${errorMessage}`);
          }
        }

        return {
          chatType: isUserChat ? 'user' : 'member',
          isStarred, // NEW: Starred status
          blockStatus, // NEW: Blocking status (null for Member Chat)
          member: {
            _id: otherMember?._id,
            memberId: otherMember?.memberId,
            companyName: otherMember?.organisationInfo?.companyName || '',
            logo: otherMember?.organisationInfo?.memberLogoUrl,
            address: {
              city: otherMember?.organisationInfo?.address?.city,
              country: otherMember?.organisationInfo?.address?.country,
            },
          },
          user: userDetails,
          lastMessage: {
            content: conv.lastMessage.content,
            senderId: conv.lastMessage.senderId,
            senderUserId: conv.lastMessage.senderUserId,      // NEW: Sender user ID
            recipientId: conv.lastMessage.recipientId,        // NEW: Recipient member ID
            recipientUserId: conv.lastMessage.recipientUserId, // NEW: Recipient user ID
            createdAt: conv.lastMessage.createdAt,
            isRead: conv.lastMessage.isRead,
            type: conv.lastMessage.type,
            fileUrl,
            fileName: conv.lastMessage.fileName,
            fileSize: conv.lastMessage.fileSize,
            mimeType: conv.lastMessage.mimeType,
            fileUrlExpiresAt,
            fileUrlExpiresIn,
          },
          unreadCount: conv.unreadCount,
        };
      }),
    );

    return {
      conversations,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get messages between current user and another member/user
   * ROUTING: Returns Member Chat OR User Chat based on otherUserId parameter
   */
  async getMessages(
    email: string,
    query: GetMessagesQueryDto,
  ): Promise<{ messages: any[]; total: number; page: number; pageSize: number; blockStatus?: any }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;
    const currentIsPrimary = senderData.isPrimary;
    const otherMemberId = query.otherMemberId;
    const otherUserId = query.otherUserId;

    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '50', 10);
    const skip = (page - 1) * pageSize;

    let filter: any;
    
    if (otherUserId) {
      // User Chat: Filter by both member IDs and user IDs
      filter = {
        $or: [
          { 
            senderId: currentMemberId, 
            senderUserId: currentUserId,
            recipientId: otherMemberId, 
            recipientUserId: otherUserId 
          },
          { 
            senderId: otherMemberId, 
            senderUserId: otherUserId,
            recipientId: currentMemberId, 
            recipientUserId: currentUserId 
          },
        ],
      };
    } else if (currentIsPrimary) {
      // Member Chat: Only for Primary users, no userId fields
      filter = {
        $or: [
          { 
            senderId: currentMemberId, 
            recipientId: otherMemberId,
            senderUserId: { $exists: false },
            recipientUserId: { $exists: false }
          },
          { 
            senderId: otherMemberId, 
            recipientId: currentMemberId,
            senderUserId: { $exists: false },
            recipientUserId: { $exists: false }
          },
        ],
      };
    } else {
      // Secondary user without otherUserId → return empty (no member chat access)
      filter = { _id: null };
    }

    // Always filter out deleted messages
    filter.isDeleted = { $ne: true };

    // For User Chat: Filter out blocked messages for the recipient
    // (Blocked messages should only be visible to the sender)
    if (otherUserId) {
      // Add condition to exclude messages where:
      // - Current user is the recipient AND message is marked as blocked
      filter.$and = [
        {
          $or: [
            // Show all messages where current user is sender (including blocked ones they sent)
            { senderId: currentMemberId, senderUserId: currentUserId },
            // Show messages where current user is recipient BUT only non-blocked ones
            { 
              recipientId: currentMemberId, 
              recipientUserId: currentUserId,
              isBlockedMessage: { $ne: true }
            }
          ]
        }
      ];
    }

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.messageModel.countDocuments(filter),
    ]);

    // Reverse to show oldest first
    messages.reverse();

    // Generate signed URLs for file attachments
    for (const message of messages) {
      if (message.fileUrl && message.type !== 'text') {
        try {
          this.logger.log(`Processing message ${message._id} with fileUrl: ${message.fileUrl}`);
          
          // Extract blob path from URL (in case it's a full URL with existing SAS params)
          const blobPath = this.blobService.extractBlobPath(message.fileUrl);
          this.logger.log(`Extracted blob path: ${blobPath}`);
          
          // Always generate fresh signed URL with 12-hour expiry
          const { url, expiresAt, expiresIn } = this.blobService.getSignedUrlWithMetadata(blobPath, 43200); // 12 hours
          message.fileUrl = url;
          message.fileUrlExpiresAt = expiresAt;
          message.fileUrlExpiresIn = expiresIn;
          
          this.logger.log(`Generated signed URL with expiry at ${expiresAt.toISOString()}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to generate signed URL for message ${message._id}: ${errorMessage}`);
          // Keep original URL if signed URL generation fails
        }
      }
    }

    // Get blocking status for User Chat
    let blockStatus = null;
    if (otherUserId) {
      const [iBlockedThem, theyBlockedMe] = await Promise.all([
        this.hasBlockedUser(currentUserId, otherUserId),
        this.isBlockedByUser(currentUserId, otherUserId),
      ]);
      
      blockStatus = {
        isBlocked: iBlockedThem || theyBlockedMe,
        iBlockedThem,
        theyBlockedMe,
      };
    }

    return {
      messages,
      total,
      page,
      pageSize,
      blockStatus, // NEW: Blocking information
    };
  }

  /**
   * Mark messages as read
   * ROUTING: Marks Member Chat OR User Chat messages as read based on otherUserId
   */
  async markAsRead(email: string, otherMemberId: string, otherUserId?: string): Promise<{ modifiedCount: number }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;
    const currentIsPrimary = senderData.isPrimary;

    let filter: any;
    
    if (otherUserId) {
      // User Chat: Mark messages between specific users
      filter = {
        senderId: otherMemberId,
        senderUserId: otherUserId,
        recipientId: currentMemberId,
        recipientUserId: currentUserId,
        isRead: false,
      };
    } else if (currentIsPrimary) {
      // Member Chat: Only Primary users can access member chat
      filter = {
        senderId: otherMemberId,
        recipientId: currentMemberId,
        isRead: false,
        senderUserId: { $exists: false },
        recipientUserId: { $exists: false },
      };
    } else {
      // Secondary user without otherUserId → no member chat access
      filter = { _id: null };
    }

    const result = await this.messageModel.updateMany(
      filter,
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    const chatType = otherUserId ? 'User Chat' : 'Member Chat';
    const logContext = otherUserId 
      ? `for user ${currentUserId} from user ${otherUserId}` 
      : `for member ${currentMemberId} from member ${otherMemberId}`;
    this.logger.log(`[${chatType}] Marked ${result.modifiedCount} messages as read ${logContext}`);

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * ============================================
   * STAR / UNSTAR CONVERSATIONS
   * ============================================
   */

  /**
   * Star a conversation
   */
  async starConversation(
    email: string, 
    otherMemberId: string, 
    otherUserId?: string
  ): Promise<{ success: boolean; message: string }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;

    // Upsert conversation preference
    await this.conversationPreferencesModel.findOneAndUpdate(
      {
        userId: currentUserId,
        memberId: currentMemberId,
        otherMemberId,
        otherUserId: otherUserId || null,
      },
      {
        $set: {
          isStarred: true,
          starredAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    const chatType = otherUserId ? 'User Chat' : 'Member Chat';
    this.logger.log(`[${chatType}] Conversation starred by user ${currentUserId} with ${otherMemberId}${otherUserId ? `/${otherUserId}` : ''}`);

    return { success: true, message: 'Conversation starred successfully' };
  }

  /**
   * Unstar a conversation
   */
  async unstarConversation(
    email: string, 
    otherMemberId: string, 
    otherUserId?: string
  ): Promise<{ success: boolean; message: string }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;

    await this.conversationPreferencesModel.findOneAndUpdate(
      {
        userId: currentUserId,
        memberId: currentMemberId,
        otherMemberId,
        otherUserId: otherUserId || null,
      },
      {
        $set: {
          isStarred: false,
          starredAt: null,
        },
      }
    );

    const chatType = otherUserId ? 'User Chat' : 'Member Chat';
    this.logger.log(`[${chatType}] Conversation unstarred by user ${currentUserId} with ${otherMemberId}${otherUserId ? `/${otherUserId}` : ''}`);

    return { success: true, message: 'Conversation unstarred successfully' };
  }

  /**
   * Get starred status for a conversation
   */
  private async getStarredStatus(
    userId: string, 
    memberId: string, 
    otherMemberId: string, 
    otherUserId?: string
  ): Promise<boolean> {
    const preference = await this.conversationPreferencesModel.findOne({
      userId,
      memberId,
      otherMemberId,
      otherUserId: otherUserId || null,
      isStarred: true,
    }).lean();

    return !!preference;
  }

  /**
   * ============================================
   * BLOCK / UNBLOCK USERS
   * ============================================
   */

  /**
   * Block a user from sending messages (User-level SOFT block)
   * - Blocker: Cannot send messages, conversation hidden
   * - Blocked: Can send messages but they won't reach blocker
   */
  async blockUser(
    email: string, 
    blockedUserId: string, 
    blockedMemberId: string
  ): Promise<{ success: boolean; message: string }> {
    const senderData = await this.findUserByEmail(email);
    const blockerId = senderData.user.id;
    const blockerMemberId = senderData.member.memberId;

    // Validate blocked user exists
    const blockedMember = await this.memberModel.findOne({ memberId: blockedMemberId });
    if (!blockedMember) {
      throw new NotFoundException('User to block not found');
    }

    const blockedUser = blockedMember.userSnapshots?.find((u: any) => u.id === blockedUserId);
    if (!blockedUser) {
      throw new NotFoundException('User to block not found in member userSnapshots');
    }

    // Cannot block yourself
    if (blockerId === blockedUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Cannot block users from same member
    if (blockerMemberId === blockedMemberId) {
      throw new BadRequestException('Cannot block users from your own organization');
    }

    // Find connection between the two members
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: blockerMemberId, recipientId: blockedMemberId },
        { requesterId: blockedMemberId, recipientId: blockerMemberId },
      ],
      status: ConnectionStatus.ACCEPTED,
    });

    if (!connection) {
      throw new NotFoundException('No active connection found between these members');
    }

    // Initialize blockedUsers array if it doesn't exist
    if (!connection.blockedUsers) {
      connection.blockedUsers = [];
    }

    // SINGLE ENTRY ONLY - check if block already exists
    const existingBlockIndex = connection.blockedUsers.findIndex(
      (block: any) => block.blockerId === blockerId && block.blockedUserId === blockedUserId
    );

    if (existingBlockIndex >= 0) {
      // Reactivate existing block
      connection.blockedUsers[existingBlockIndex].isActive = true;
      connection.blockedUsers[existingBlockIndex].blockedAt = new Date();
      connection.blockedUsers[existingBlockIndex].isBlocker = true;
    } else {
      // Add new block - SINGLE ENTRY (no reverse entry created)
      connection.blockedUsers.push({
        blockerId,
        blockedUserId,
        blockerMemberId,
        blockedMemberId,
        blockedAt: new Date(),
        isActive: true,
        isBlocker: true,
      } as any);
    }

    await connection.save();

    this.logger.log(`[User-level block] User ${blockerId} blocked user ${blockedUserId} in connection ${connection._id}`);

    return { success: true, message: 'User blocked successfully' };
  }

  /**
   * Unblock a user (User-level unblock)
   * Deactivates both blocker and blocked side blocks
   */
  async unblockUser(
    email: string, 
    blockedUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const senderData = await this.findUserByEmail(email);
    const blockerId = senderData.user.id;
    const blockerMemberId = senderData.member.memberId;

    // Find the blocked user's member
    const blockedMember = await this.memberModel.findOne({
      'userSnapshots.id': blockedUserId,
    });

    if (!blockedMember) {
      throw new NotFoundException('Blocked user not found');
    }

    // Find connection between the two members
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: blockerMemberId, recipientId: blockedMember.memberId },
        { requesterId: blockedMember.memberId, recipientId: blockerMemberId },
      ],
    });

    if (!connection || !connection.blockedUsers) {
      throw new NotFoundException('No block found');
    }

    // Deactivate blocker side block
    const blockerBlockIndex = connection.blockedUsers.findIndex(
      (block: any) => 
        block.blockerId === blockerId && 
        block.blockedUserId === blockedUserId &&
        block.isActive
    );

    // Deactivate blocked side block
    const blockedBlockIndex = connection.blockedUsers.findIndex(
      (block: any) => 
        block.blockerId === blockedUserId && 
        block.blockedUserId === blockerId &&
        block.isActive
    );

    if (blockerBlockIndex === -1 && blockedBlockIndex === -1) {
      throw new NotFoundException('Block record not found');
    }

    if (blockerBlockIndex >= 0) {
      connection.blockedUsers[blockerBlockIndex].isActive = false;
    }

    if (blockedBlockIndex >= 0) {
      connection.blockedUsers[blockedBlockIndex].isActive = false;
    }

    await connection.save();

    this.logger.log(`[User-level unblock] User ${blockerId} unblocked user ${blockedUserId}`);

    return { success: true, message: 'User unblocked successfully' };
  }

  /**
   * Check if a user is blocked (bidirectional) - checks connection.blockedUsers
   * Returns true if either user has blocked the other
   */
  private async isUserBlocked(senderId: string, recipientId: string): Promise<boolean> {
    // Find members for both users
    const senderMember = await this.memberModel.findOne({
      'userSnapshots.id': senderId,
    }).lean();

    const recipientMember = await this.memberModel.findOne({
      'userSnapshots.id': recipientId,
    }).lean();

    if (!senderMember || !recipientMember) {
      return false;
    }

    // Same member - no blocking
    if (senderMember.memberId === recipientMember.memberId) {
      return false;
    }

    // Find connection
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: senderMember.memberId, recipientId: recipientMember.memberId },
        { requesterId: recipientMember.memberId, recipientId: senderMember.memberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers) {
      return false;
    }

    // Check if either user has blocked the other
    const isBlocked = connection.blockedUsers.some(
      (block: any) =>
        block.isActive &&
        ((block.blockerId === recipientId && block.blockedUserId === senderId) ||
          (block.blockerId === senderId && block.blockedUserId === recipientId))
    );

    return isBlocked;
  }

  /**
   * Check if current user has blocked another user
   */
  private async hasBlockedUser(currentUserId: string, otherUserId: string): Promise<boolean> {
    // Find members for both users
    const currentMember = await this.memberModel.findOne({
      'userSnapshots.id': currentUserId,
    }).lean();

    const otherMember = await this.memberModel.findOne({
      'userSnapshots.id': otherUserId,
    }).lean();

    if (!currentMember || !otherMember) {
      return false;
    }

    // Same member - no blocking
    if (currentMember.memberId === otherMember.memberId) {
      return false;
    }

    // Find connection
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: currentMember.memberId, recipientId: otherMember.memberId },
        { requesterId: otherMember.memberId, recipientId: currentMember.memberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers) {
      return false;
    }

    // Check if current user has blocked the other
    const hasBlocked = connection.blockedUsers.some(
      (block: any) =>
        block.isActive &&
        block.blockerId === currentUserId &&
        block.blockedUserId === otherUserId
    );

    return hasBlocked;
  }

  /**
   * Check if current user is blocked by another user at the connection level
   */
  private async isBlockedByUser(currentUserId: string, otherUserId: string): Promise<boolean> {
    // Find connection between the two users' members
    const currentUserMember = await this.memberModel.findOne({
      'userSnapshots.id': currentUserId,
    }).lean();

    const otherUserMember = await this.memberModel.findOne({
      'userSnapshots.id': otherUserId,
    }).lean();

    if (!currentUserMember || !otherUserMember) {
      return false; // No block if members not found
    }

    // Same member - no blocking allowed (internal team)
    if (currentUserMember.memberId === otherUserMember.memberId) {
      return false;
    }

    // Find connection between the two members
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: currentUserMember.memberId, recipientId: otherUserMember.memberId },
        { requesterId: otherUserMember.memberId, recipientId: currentUserMember.memberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers || connection.blockedUsers.length === 0) {
      return false; // No blocks
    }

    // Check if there's an active block for this user pair
    const isBlocked = connection.blockedUsers.some(
      (block: any) =>
        block.blockerId === otherUserId &&
        block.blockedUserId === currentUserId &&
        block.isActive
    );

    return isBlocked;
  }

  /**
   * Check if current member has blocked another member (member-level blocking)
   */
  private async hasBlockedMember(currentMemberId: string, otherMemberId: string): Promise<boolean> {
    // Find connection
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: currentMemberId, recipientId: otherMemberId },
        { requesterId: otherMemberId, recipientId: currentMemberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers || connection.blockedUsers.length === 0) {
      return false;
    }

    // Check if there's any active member-to-member block from current member to other member
    const hasBlocked = connection.blockedUsers.some(
      (block: any) =>
        block.isActive &&
        block.blockType === 'member-to-member' &&
        block.blockerMemberId === currentMemberId &&
        block.blockedMemberId === otherMemberId
    );

    return hasBlocked;
  }

  /**
   * Check if current member is blocked by another member (member-level blocking)
   */
  private async isBlockedByMember(currentMemberId: string, otherMemberId: string): Promise<boolean> {
    // Find connection
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: currentMemberId, recipientId: otherMemberId },
        { requesterId: otherMemberId, recipientId: currentMemberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers || connection.blockedUsers.length === 0) {
      return false;
    }

    // Check if there's any active member-to-member block from other member to current member
    const isBlocked = connection.blockedUsers.some(
      (block: any) =>
        block.isActive &&
        block.blockType === 'member-to-member' &&
        block.blockerMemberId === otherMemberId &&
        block.blockedMemberId === currentMemberId
    );

    return isBlocked;
  }

  /**
   * Check if user is the blocker (initiated the block)
   * Returns true if user blocked the other member and should NOT be able to send messages
   */
  private async isUserTheBlocker(
    userId: string,
    userMemberId: string,
    otherMemberId: string
  ): Promise<boolean> {
    // Find connection between members
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: userMemberId, recipientId: otherMemberId },
        { requesterId: otherMemberId, recipientId: userMemberId },
      ],
    }).lean();

    if (!connection || !connection.blockedUsers) {
      return false;
    }

    // Check if this user is a blocker (isBlocker: true and isActive: true)
    const isBlocker = connection.blockedUsers.some(
      (block: any) => 
        block.blockerId === userId &&
        block.isBlocker === true &&
        block.isActive === true
    );

    return isBlocker;
  }

  /**
   * Get list of blocked users - reads from connection.blockedUsers
   */
  async getBlockedUsers(email: string): Promise<any[]> {
    const senderData = await this.findUserByEmail(email);
    const blockerId = senderData.user.id;
    const currentMemberId = senderData.member.memberId;

    // Find all connections where current member is involved
    const connections = await this.connectionModel.find({
      $or: [
        { requesterId: currentMemberId },
        { recipientId: currentMemberId },
      ],
      status: ConnectionStatus.ACCEPTED,
    }).lean();

    const blockedUsersDetails: any[] = [];

    // Iterate through connections and extract blocked users
    for (const connection of connections) {
      if (!connection.blockedUsers || connection.blockedUsers.length === 0) {
        continue;
      }

      // Filter blocks where current user is the blocker
      const userBlocks = connection.blockedUsers.filter(
        (block: any) => block.blockerId === blockerId && block.isActive
      );

      // Populate user details for each block
      for (const block of userBlocks) {
        const member = await this.memberModel.findOne({
          'userSnapshots.id': block.blockedUserId,
        }).lean();

        if (!member) continue;

        const user = member.userSnapshots?.find((u: any) => u.id === block.blockedUserId);
        if (!user) continue;

        blockedUsersDetails.push({
          userId: block.blockedUserId,
          memberId: member.memberId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          userType: user.userType,
          companyName: member.organisationInfo?.companyName,
          blockedAt: block.blockedAt,
        });
      }
    }

    return blockedUsersDetails;
  }


  /**
   * ============================================
   * DELETE MESSAGES
   * ============================================
   */

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    email: string, 
    messageId: string
  ): Promise<{ success: boolean; message: string }> {
    const senderData = await this.findUserByEmail(email);
    const currentMemberId = senderData.member.memberId;
    const currentUserId = senderData.user.id;

    // Find the message
    const msg = await this.messageModel.findById(messageId);
    if (!msg) {
      throw new NotFoundException('Message not found');
    }

    // Authorization: Only sender can delete
    const isSender = msg.senderUserId 
      ? msg.senderUserId === currentUserId 
      : msg.senderId === currentMemberId;

    if (!isSender) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Soft delete
    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.deletedBy = currentUserId;
    await msg.save();

    this.logger.log(`Message ${messageId} deleted by user ${currentUserId}`);

    return { success: true, message: 'Message deleted successfully' };
  }

  /**
   * ============================================
   * EMAIL NOTIFICATIONS
   * ============================================
   */

  /**
   * Send email notification for new chat message
   */
  private async sendNewMessageEmail(
    senderData: { member: MemberDocument; user: any; isPrimary: boolean },
    recipientMember: MemberDocument,
    recipientUserId: string | undefined,
    isUserChat: boolean,
    messageContent: string,
    messageType: string
  ): Promise<void> {
    try {
      let recipientEmail: string;
      let recipientName: string;
      let senderName: string;
      const senderCompanyName = senderData.member.organisationInfo?.companyName || 'A member';

      if (isUserChat && recipientUserId) {
        // User Chat - send to specific user
        const recipientUser = recipientMember.userSnapshots?.find(u => u.id === recipientUserId);
        if (!recipientUser || !recipientUser.email) {
          this.logger.warn(`Recipient user ${recipientUserId} not found or has no email`);
          return;
        }
        
        recipientEmail = recipientUser.email;
        recipientName = `${recipientUser.firstName || ''} ${recipientUser.lastName || ''}`.trim() || recipientUser.email;
        senderName = `${senderData.user.firstName || ''} ${senderData.user.lastName || ''}`.trim() || senderData.user.email;

        // Send User Chat notification
        await this.emailService.sendTemplatedEmail({
          to: recipientEmail,
          templateCode: EmailTemplateCode.NEW_CHAT_MESSAGE,
          params: {
            recipientName,
            senderName,
            senderCompany: senderCompanyName,
            messagePreview: this.getMessagePreview(messageContent, messageType),
            messageType,
            chatUrl: `${process.env.FRONTEND_URL || 'https://app.theonezone.org'}/chat`,
          },
        });

        this.logger.log(`Email notification sent to ${recipientEmail} for new user chat message`);
      } else {
        // Member Chat - send to Primary user
        const primaryUser = recipientMember.userSnapshots?.find(u => u.userType === 'Primary');
        if (!primaryUser || !primaryUser.email) {
          this.logger.warn(`Primary user not found or has no email for member ${recipientMember.memberId}`);
          return;
        }

        recipientEmail = primaryUser.email;
        recipientName = `${primaryUser.firstName || ''} ${primaryUser.lastName || ''}`.trim() || primaryUser.email;
        senderName = senderData.member.organisationInfo?.companyName || 'A member';

        // Send Member Chat notification
        await this.emailService.sendTemplatedEmail({
          to: recipientEmail,
          templateCode: EmailTemplateCode.NEW_CHAT_MESSAGE_MEMBER,
          params: {
            recipientName,
            senderCompany: senderCompanyName,
            messagePreview: this.getMessagePreview(messageContent, messageType),
            messageType,
            chatUrl: `${process.env.FRONTEND_URL || 'https://app.theonezone.org'}/chat`,
          },
        });

        this.logger.log(`Email notification sent to ${recipientEmail} for new member chat message`);
      }
    } catch (error) {
      // Don't throw - email failure shouldn't break chat functionality
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error sending email notification: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Get message preview for email
   */
  private getMessagePreview(content: string, type: string): string {
    if (type === 'image') {
      return '📷 Sent an image';
    } else if (type === 'document') {
      return '📎 Sent a document';
    } else {
      // Truncate text messages to 100 characters
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
  }
}

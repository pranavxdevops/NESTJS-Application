import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Connection, ConnectionDocument, ConnectionStatus } from './schemas/connection.schema';
import { Member, MemberDocument } from '../member/schemas/member.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { SendConnectionRequestDto, GetConnectionsQueryDto } from './dto/connection.dto';
import { Console } from 'console';
import { EmailService } from '../../shared/email/email.service';
import { EmailTemplateCode, SupportedLanguage } from '../../shared/email/schemas/email-template.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);
  private readonly platformUrl: string;

  constructor(
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>,
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.platformUrl = this.configService.get<string>('PLATFORM_URL') || 'https://wfzo.com';
  }

  /**
   * Helper: Find member by email (username) from JWT token
   * Searches directly in member's userSnapshots by email
   */
  private async findMemberByEmail(email: string): Promise<MemberDocument> {
    this.logger.log(`Finding member for email: ${email}`);
    
    // Find member directly by email in userSnapshots array
    const member = await this.memberModel.findOne({
      'userSnapshots.email': email,
      'userSnapshots.userType': 'Primary',
      status: 'active', // Only active members
    });

    if (!member) {
      this.logger.error(`No active member found with Primary user email: ${email}`);
      throw new NotFoundException('Member profile not found for this user');
    }

    this.logger.log(`Found member: ${member.memberId} (${member._id})`);
    return member;
  }

  /**
   * Helper: Find member and user details by email (works for both Primary and Secondary users)
   */
  private async findMemberAndUserByEmail(email: string): Promise<{ member: MemberDocument; user: any; isPrimary: boolean }> {
    this.logger.log(`Finding member and user for email: ${email}`);
    
    // Find member by email in userSnapshots array (any user type)
    const member = await this.memberModel.findOne({
      'userSnapshots.email': email,
      status: 'active',
    });

    if (!member) {
      this.logger.error(`No active member found with user email: ${email}`);
      throw new NotFoundException('Member profile not found for this user');
    }

    // Find the user in userSnapshots
    const user = member.userSnapshots?.find(u => u.email === email);
    if (!user) {
      throw new NotFoundException('User not found in member userSnapshots');
    }

    const isPrimary = user.userType === 'Primary';
    this.logger.log(`Found member: ${member.memberId}, user: ${user.id}, type: ${user.userType}`);
    
    return { member, user, isPrimary };
  }

  /**
   * Send a connection request
   */
  async sendConnectionRequest(
    email: string,
    dto: SendConnectionRequestDto,
  ): Promise<ConnectionDocument> {
    const { recipientId, note } = dto;

    // Find the requester member by email
    const requesterMember = await this.findMemberByEmail(email);
    const requesterMemberId = requesterMember.memberId; // Use memberId string like MEMBER-001

    // Check if recipient member exists by memberId
    const recipient = await this.memberModel.findOne({ memberId: recipientId });
    if (!recipient) {
      throw new NotFoundException('Recipient member not found');
    }

    // Validate that members are not the same
    if (requesterMemberId === recipientId) {
      throw new BadRequestException('Cannot send connection request to yourself');
    }

    // Check if connection already exists (either direction)
    const existingConnection = await this.connectionModel.findOne({
      $or: [
        { requesterId: requesterMemberId, recipientId: recipientId },
        { requesterId: recipientId, recipientId: requesterMemberId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.PENDING) {
        throw new BadRequestException('Connection request already sent');
      }
      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        throw new BadRequestException('You are already connected with this user');
      }
      if (existingConnection.status === ConnectionStatus.BLOCKED) {
        throw new BadRequestException('Cannot send connection request to this user');
      }
      if (existingConnection.status === ConnectionStatus.REJECTED && !existingConnection.canResend) {
        throw new BadRequestException('Cannot resend connection request at this time');
      }

      // If rejected and can resend, update the existing connection
      if (existingConnection.status === ConnectionStatus.REJECTED && existingConnection.canResend) {
        existingConnection.status = ConnectionStatus.PENDING;
        existingConnection.note = note;
        existingConnection.canResend = false;
        existingConnection.rejectedAt = undefined;
        return existingConnection.save();
      }
    }

    // Create new connection request
    const connection = new this.connectionModel({
      requesterId: requesterMemberId,
      recipientId: recipientId,
      status: ConnectionStatus.PENDING,
      note,
    });

    const savedConnection = await connection.save();
    this.logger.log(`Connection request sent from ${requesterMemberId} to ${recipientId}`);

    // Send email notification to recipient
    await this.sendConnectionRequestEmail(requesterMember, recipient);

    return savedConnection;
  }

  /**
   * Accept a connection request (bidirectional)
   */
  async acceptConnectionRequest(connectionId: string, email: string): Promise<ConnectionDocument> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Find current member to get their memberId
    const currentMember = await this.findMemberByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Only recipient can accept
    if (connection.recipientId !== currentMemberId) {
      throw new BadRequestException('Only the recipient can accept this request');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('This connection request cannot be accepted');
    }

    connection.status = ConnectionStatus.ACCEPTED;
    connection.acceptedAt = new Date();

    const savedConnection = await connection.save();
    this.logger.log(`Connection accepted: ${connectionId}`);

    // Get requester member details to send them acceptance notification
    const requesterMember = await this.memberModel.findOne({ memberId: connection.requesterId });
    if (requesterMember) {
      await this.sendConnectionAcceptedEmail(requesterMember, currentMember);
    }

    return savedConnection;
  }

  /**
   * Reject a connection request
   */
  async rejectConnectionRequest(connectionId: string, email: string): Promise<ConnectionDocument> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Find current member to get their memberId
    const currentMember = await this.findMemberByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Only recipient can reject
    if (connection.recipientId !== currentMemberId) {
      throw new BadRequestException('Only the recipient can reject this request');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('This connection request cannot be rejected');
    }

    connection.status = ConnectionStatus.REJECTED;
    connection.rejectedAt = new Date();
    connection.canResend = true; // Allow resending after rejection

    const savedConnection = await connection.save();
    this.logger.log(`Connection rejected: ${connectionId}`);

    return savedConnection;
  }

  /**
   * Block a user (old method - kept for backward compatibility)
   */
  async blockUser(connectionId: string, email: string): Promise<ConnectionDocument> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Find current member to get their memberId
    const currentMember = await this.findMemberByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Either party can block
    if (
      connection.requesterId !== currentMemberId &&
      connection.recipientId !== currentMemberId
    ) {
      throw new BadRequestException('You cannot block this connection');
    }

    connection.status = ConnectionStatus.BLOCKED;
    connection.blockedAt = new Date();

    const savedConnection = await connection.save();
    this.logger.log(`Connection blocked: ${connectionId}`);

    return savedConnection;
  }

  /**
   * Remove connection (hard delete)
   * Deletes the connection document completely
   */
  async removeConnection(connectionId: string, email: string): Promise<{ success: boolean; message: string }> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Find current user and member
    const { member: currentMember } = await this.findMemberAndUserByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Verify user is part of this connection
    if (
      connection.requesterId !== currentMemberId &&
      connection.recipientId !== currentMemberId
    ) {
      throw new BadRequestException('You cannot remove this connection');
    }

    // Hard delete the connection
    await this.connectionModel.findByIdAndDelete(connectionId);

    this.logger.log(`[Connection Removal] Connection ${connectionId} hard deleted by member ${currentMemberId}`);

    return {
      success: true,
      message: 'Connection removed successfully',
    };
  }

  /**
   * Block member (organization-wide blocking)
   * Creates block entries for ALL users from both organizations
   */
  async blockMember(
    connectionId: string,
    blockedMemberId: string,
    email: string,
  ): Promise<{ success: boolean; message: string; blocksCreated: number }> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Find current user and member
    const { member: currentMember } = await this.findMemberAndUserByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Verify connection involves these members
    const otherMemberId = connection.requesterId === currentMemberId 
      ? connection.recipientId 
      : connection.requesterId;

    if (otherMemberId !== blockedMemberId) {
      throw new BadRequestException('Connection does not involve the specified member');
    }

    // Cannot block your own organization
    if (currentMemberId === blockedMemberId) {
      throw new BadRequestException('Cannot block your own organization');
    }

    // Only accepted connections can be blocked
    if (connection.status !== ConnectionStatus.ACCEPTED) {
      throw new BadRequestException('Can only block accepted connections');
    }

    // Get all users from blocked member
    const blockedMember = await this.memberModel.findOne({ memberId: blockedMemberId });
    if (!blockedMember) {
      throw new NotFoundException('Blocked member not found');
    }

    // Get all users from both members
    const currentMemberUsers = currentMember.userSnapshots || [];
    const blockedMemberUsers = blockedMember.userSnapshots || [];

    // Initialize blockedUsers array if doesn't exist
    if (!connection.blockedUsers) {
      connection.blockedUsers = [];
    }

    let blocksCreated = 0;

    // Create block entries for ALL user combinations (SINGLE ENTRY per pair - same as chat/block-user)
    for (const currentUser of currentMemberUsers) {
      for (const blockedUser of blockedMemberUsers) {
        // SINGLE ENTRY ONLY - Current user blocks blocked user
        const existingBlockIndex = connection.blockedUsers.findIndex(
          (b: any) => b.blockerId === currentUser.id && b.blockedUserId === blockedUser.id
        );

        if (existingBlockIndex >= 0) {
          // Reactivate existing block
          connection.blockedUsers[existingBlockIndex].isActive = true;
          connection.blockedUsers[existingBlockIndex].blockType = 'member-to-member';
          connection.blockedUsers[existingBlockIndex].blockedAt = new Date();
          connection.blockedUsers[existingBlockIndex].isBlocker = true;
        } else {
          // Add new block - SINGLE ENTRY (no reverse entry)
          connection.blockedUsers.push({
            blockerId: currentUser.id,
            blockedUserId: blockedUser.id,
            blockerMemberId: currentMemberId,
            blockedMemberId: blockedMemberId,
            blockedAt: new Date(),
            isActive: true,
            isBlocker: true,
            blockType: 'member-to-member',
          } as any);
          blocksCreated++;
        }
      }
    }

    // Update member-level block metadata
    (connection as any).memberBlockedAt = new Date();
    (connection as any).memberBlockLevel = 'member-to-member';

    await connection.save();

    this.logger.log(
      `[Member Block] Member ${currentMemberId} blocked member ${blockedMemberId} in connection ${connectionId}. Blocks created: ${blocksCreated}`
    );

    return {
      success: true,
      message: `Member ${blockedMemberId} blocked successfully (all users affected)`,
      blocksCreated,
    };
  }

  /**
   * Unblock member (remove all member-level blocks)
   * Removes ALL member-to-member block entries between the two organizations
   */
  async unblockMember(
    connectionId: string,
    unblockedMemberId: string,
    email: string,
  ): Promise<{ success: boolean; message: string; blocksRemoved: number }> {
    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Find current user and member
    const { member: currentMember } = await this.findMemberAndUserByEmail(email);
    const currentMemberId = currentMember.memberId;

    // Verify connection involves these members
    const otherMemberId = connection.requesterId === currentMemberId 
      ? connection.recipientId 
      : connection.requesterId;

    if (otherMemberId !== unblockedMemberId) {
      throw new BadRequestException('Connection does not involve the specified member');
    }

    if (!connection.blockedUsers || connection.blockedUsers.length === 0) {
      throw new NotFoundException('No blocks found');
    }

    // Count blocks before removal
    const blocksBefore = connection.blockedUsers.length;

    // Remove all member-to-member blocks between these two members
    connection.blockedUsers = connection.blockedUsers.filter((block: any) => {
      // Check if this block involves these two members
      const involvesBothMembers = 
        (block.blockerMemberId === currentMemberId && block.blockedMemberId === unblockedMemberId) ||
        (block.blockerMemberId === unblockedMemberId && block.blockedMemberId === currentMemberId);
      
      if (!involvesBothMembers) {
        return true; // Keep blocks between other members
      }

      // If blockType is explicitly set to 'user-to-user', keep it
      if (block.blockType === 'user-to-user') {
        return true; // Keep user-level blocks
      }

      // Remove if:
      // 1. blockType is 'member-to-member', OR
      // 2. blockType is missing/undefined (assume it's a member-level block from before we added the field)
      return false; // Remove member-to-member blocks or blocks without blockType
    });

    const blocksAfter = connection.blockedUsers.length;
    const blocksRemoved = blocksBefore - blocksAfter;

    // Clear member-level block metadata
    (connection as any).memberBlockedAt = undefined;
    (connection as any).memberBlockLevel = 'none';

    await connection.save();

    this.logger.log(
      `[Member Unblock] Member ${currentMemberId} unblocked member ${unblockedMemberId} in connection ${connectionId}. Blocks removed: ${blocksRemoved}`
    );

    return {
      success: true,
      message: `Member ${unblockedMemberId} unblocked successfully`,
      blocksRemoved,
    };
  }

  /**
   * Get user's connections (accepted connections + same-member users)
   * 
   * Returns:
   * 1. Connected members (existing behavior)
   * 2. Same-member users for internal chat (NEW)
   */
  async getMyConnections(
    email: string,
    query: GetConnectionsQueryDto,
  ): Promise<{ connections: any[]; total: number; page: number; pageSize: number }> {
    // Find the current user and member (works for both Primary and Secondary)
    const { member: currentMember, user: currentUser } = await this.findMemberAndUserByEmail(email);
    const currentMemberId = currentMember.memberId;
    const currentUserId = currentUser.id;
    
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const skip = (page - 1) * pageSize;

    // 1. Get accepted connections (existing behavior)
    const filter: any = {
      $or: [
        { requesterId: currentMemberId },
        { recipientId: currentMemberId },
      ],
      status: ConnectionStatus.ACCEPTED,
    };

    const [connections, total] = await Promise.all([
      this.connectionModel
        .find(filter)
        .sort({ acceptedAt: -1 })
        .lean(),
      this.connectionModel.countDocuments(filter),
    ]);

    // Transform connected members (existing behavior)
    let transformedConnections = await Promise.all(
      connections.map(async (conn: any) => {
        const isRequester = conn.requesterId === currentMemberId;
        const otherMemberId = isRequester ? conn.recipientId : conn.requesterId;
        
        // Fetch the other member's details with userSnapshots
        const otherMember = await this.memberModel
          .findOne({ memberId: otherMemberId })
          .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl organisationInfo.address organisationInfo.industries userSnapshots')
          .lean();

        // Extract and group users from userSnapshots
        const primaryUsers = (otherMember?.userSnapshots || [])
          .filter((user: any) => user.userType === 'Primary')
          .map((user: any) => ({
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            designation: user.designation,
            userType: user.userType,
            profileImageUrl: user.profileImageUrl || null,
            memberLogoUrl: otherMember?.organisationInfo?.memberLogoUrl,
          }));

        const secondaryUsers = (otherMember?.userSnapshots || [])
          .filter((user: any) => user.userType === 'Secondary' || user.userType === 'Secondry') // Handle typo
          .map((user: any) => ({
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            designation: user.designation,
            userType: 'Secondary', // Normalize to 'Secondary'
            profileImageUrl: user.profileImageUrl || null,
            userLogoUrl: user.profileImageUrl || null,
          }));

        // Build member object
        const memberInfo = otherMember ? {
          memberId: otherMember.memberId,
          organisationInfo: otherMember.organisationInfo,
          primaryUsers,
          secondaryUsers,
        } : null;

        return {
          connectionId: conn._id,
          member: memberInfo,
          connectedAt: conn.acceptedAt,
          status: conn.status,
          isInternalTeam: false, // External connection
        };
      }),
    );

    // 2. Add same-member users for internal chat (NEW)
    // Get all users from current member EXCEPT the logged-in user
    const sameMemberUsers = (currentMember.userSnapshots || [])
      .filter((user: any) => user.id !== currentUserId); // Exclude self

    if (sameMemberUsers.length > 0) {
      // Group same-member users
      const sameMemberPrimaryUsers = sameMemberUsers
        .filter((user: any) => user.userType === 'Primary')
        .map((user: any) => ({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          designation: user.designation,
          userType: user.userType,
          profileImageUrl: user.profileImageUrl || null,
          memberLogoUrl: currentMember.organisationInfo?.memberLogoUrl,
        }));

      const sameMemberSecondaryUsers = sameMemberUsers
        .filter((user: any) => user.userType === 'Secondary' || user.userType === 'Secondry')
        .map((user: any) => ({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          designation: user.designation,
          userType: 'Secondary',
          profileImageUrl: user.profileImageUrl || null,
          userLogoUrl: user.profileImageUrl || null,
        }));

      // Add internal team as a special "connection"
      transformedConnections.unshift({
        connectionId: null, // No connection record for same member
        member: {
          memberId: currentMember.memberId,
          organisationInfo: currentMember.organisationInfo,
          primaryUsers: sameMemberPrimaryUsers,
          secondaryUsers: sameMemberSecondaryUsers,
        },
        connectedAt: null, // Not a connection
        status: 'internal', // Special status for internal team
        isInternalTeam: true, // Flag to identify internal team
      });
    }

    // Apply search filter if provided
    if (query.search && query.search.trim()) {
      const searchLower = query.search.toLowerCase();
      transformedConnections = transformedConnections.filter((conn: any) => {
        const member = conn.member;
        if (!member) return false;

        const companyName = member.organisationInfo?.companyName?.toLowerCase() || '';
        const city = member.organisationInfo?.address?.city?.toLowerCase() || '';
        const state = member.organisationInfo?.address?.state?.toLowerCase() || '';
        const country = member.organisationInfo?.address?.country?.toLowerCase() || '';

        return (
          companyName.includes(searchLower) ||
          city.includes(searchLower) ||
          state.includes(searchLower) ||
          country.includes(searchLower)
        );
      });
    }

    // Apply pagination AFTER adding internal team
    const paginatedConnections = transformedConnections.slice(skip, skip + pageSize);

    // Add block status to each user in each connection
    const connectionsWithBlockStatus = await Promise.all(
      paginatedConnections.map(async (conn: any) => {
        if (!conn.member) return conn;

        // Get the connection document if it exists (not for internal team)
        const connectionDoc = conn.connectionId 
          ? await this.connectionModel.findById(conn.connectionId).lean()
          : null;

        // Track blocked users count for member-level status
        let totalUsers = 0;
        let blockedUsersCount = 0;

        // Process primary users - add blockStatus to each
        if (conn.member.primaryUsers && conn.member.primaryUsers.length > 0) {
          conn.member.primaryUsers = conn.member.primaryUsers.map((user: any) => {
            const blockStatus = this.calculateBlockStatus(
              currentUserId,
              user.userId,
              connectionDoc,
            );
            totalUsers++;
            if (blockStatus === 'blocked') blockedUsersCount++;
            return { ...user, blockStatus };
          });
        }

        // Process secondary users - add blockStatus to each
        if (conn.member.secondaryUsers && conn.member.secondaryUsers.length > 0) {
          conn.member.secondaryUsers = conn.member.secondaryUsers.map((user: any) => {
            const blockStatus = this.calculateBlockStatus(
              currentUserId,
              user.userId,
              connectionDoc,
            );
            totalUsers++;
            if (blockStatus === 'blocked') blockedUsersCount++;
            return { ...user, blockStatus };
          });
        }

        // Add member-level blockStatus
        // 'blocked' if ALL users are blocked (member-level block)
        // 'partial' if SOME users are blocked (user-level blocks)
        // 'none' if NO users are blocked
        let memberBlockStatus: 'blocked' | 'partial' | 'none' = 'none';
        if (totalUsers > 0) {
          if (blockedUsersCount === totalUsers) {
            memberBlockStatus = 'blocked'; // All users blocked = member-level block
          } else if (blockedUsersCount > 0) {
            memberBlockStatus = 'partial'; // Some users blocked = user-level blocks
          }
        }

        conn.member.blockStatus = memberBlockStatus;

        return conn;
      }),
    );

    return {
      connections: connectionsWithBlockStatus,
      total: transformedConnections.length,
      page,
      pageSize,
    };
  }

  /**
   * Calculate block status between two users
   * Returns: 'blocked' if blocked, 'none' otherwise
   */
  private calculateBlockStatus(
    currentUserId: string,
    otherUserId: string,
    connectionDoc: any,
  ): 'blocked' | 'none' {
    if (!connectionDoc || !connectionDoc.blockedUsers || connectionDoc.blockedUsers.length === 0) {
      return 'none';
    }

    // Check if either user has blocked the other
    const isBlocked = connectionDoc.blockedUsers.some((block: any) => {
      return (
        block.isActive &&
        ((block.blockerId === currentUserId && block.blockedUserId === otherUserId) ||
         (block.blockerId === otherUserId && block.blockedUserId === currentUserId))
      );
    });

    return isBlocked ? 'blocked' : 'none';
  }

  /**
   * Get received connection requests (invitations)
   */
  async getReceivedRequests(
    email: string,
    query: GetConnectionsQueryDto,
  ): Promise<{ requests: any[]; total: number; page: number; pageSize: number }> {
    // Find the member by email first
    const member = await this.findMemberByEmail(email);
    const currentMemberId = member.memberId; // Use memberId string
    
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const skip = (page - 1) * pageSize;

    const filter: any = {
      recipientId: currentMemberId,
      status: ConnectionStatus.PENDING,
    };

    const [requests, total] = await Promise.all([
      this.connectionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.connectionModel.countDocuments(filter),
    ]);

    // Manually populate requester details using memberId
    const transformedRequests = await Promise.all(
      requests.map(async (req: any) => {
        // Fetch the requester's details
        const requesterMember = await this.memberModel
          .findOne({ memberId: req.requesterId })
          .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl organisationInfo.address organisationInfo.industries')
          .lean();

        return {
          requestId: req._id,
          member: requesterMember,
          note: req.note,
          requestedAt: req.createdAt,
        };
      }),
    );

    return {
      requests: transformedRequests,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get sent connection requests (outgoing pending requests)
   * GET /connections/requests/sent
   */
  async getSentRequests(
    email: string,
    query: GetConnectionsQueryDto,
  ): Promise<{ requests: any[]; total: number; page: number; pageSize: number }> {
    const member = await this.findMemberByEmail(email);
    const currentMemberId = member.memberId;
    
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const skip = (page - 1) * pageSize;

    const filter: any = {
      requesterId: currentMemberId,
      status: ConnectionStatus.PENDING,
    };

    const [requests, total] = await Promise.all([
      this.connectionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.connectionModel.countDocuments(filter),
    ]);

    const transformedRequests = await Promise.all(
      requests.map(async (req: any) => {
        const recipientMember = await this.memberModel
          .findOne({ memberId: req.recipientId })
          .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl organisationInfo.address organisationInfo.industries')
          .lean();

        return {
          requestId: req._id,
          member: recipientMember,
          note: req.note,
          requestedAt: req.createdAt,
        };
      }),
    );

    return {
      requests: transformedRequests,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get suggested members based on industry, location, and mutual connections
   */
  async getSuggestedMembers(
    email: string,
    page: number = 1,
    pageSize: number = 5,
  ): Promise<{ members: any[]; total: number; page: number; pageSize: number }> {
    const skip = (page - 1) * pageSize;

    // Find current member by email
    const currentMember = await this.findMemberByEmail(email);
    const currentMemberId = currentMember.memberId; // Use memberId string

    // Get all member's connections (accepted, pending, rejected, blocked)
    const memberConnections = await this.connectionModel
      .find({
        $or: [{ requesterId: currentMemberId }, { recipientId: currentMemberId }],
      })
      .lean();

    // Extract connected memberIds (these are already strings)
    const connectedMemberIds = memberConnections.map((conn: any) => {
      return conn.requesterId === currentMemberId
        ? conn.recipientId
        : conn.requesterId;
    });

    // Build match criteria for suggestions
    const matchCriteria: any = {
      memberId: { $nin: [currentMemberId, ...connectedMemberIds] },
      status: 'active', // Only suggest active members (lowercase to match DB)
    };

    // Match by industry and/or location
    const orConditions: any[] = [];
    
    // Match industries (Member has industries as an array)
    if (currentMember.organisationInfo?.industries && currentMember.organisationInfo.industries.length > 0) {
      this.logger.log(`Matching industries: ${currentMember.organisationInfo.industries.join(', ')}`);
      orConditions.push({ 'organisationInfo.industries': { $in: currentMember.organisationInfo.industries } });
    }
    
    // Match location (city, state, or country)
    if (currentMember.organisationInfo?.address?.city) {
      this.logger.log(`Matching city: ${currentMember.organisationInfo.address.city}`);
      orConditions.push({ 'organisationInfo.address.city': currentMember.organisationInfo.address.city });
    }
    if (currentMember.organisationInfo?.address?.state) {
      this.logger.log(`Matching state: ${currentMember.organisationInfo.address.state}`);
      orConditions.push({ 'organisationInfo.address.state': currentMember.organisationInfo.address.state });
    }
    if (currentMember.organisationInfo?.address?.country) {
      this.logger.log(`Matching country: ${currentMember.organisationInfo.address.country}`);
      orConditions.push({ 'organisationInfo.address.country': currentMember.organisationInfo.address.country });
    }

    if (orConditions.length > 0) {
      matchCriteria.$or = orConditions;
    }
    
    
    this.logger.log(`Match criteria: ${JSON.stringify(matchCriteria, null, 2)}`);
    
    // Find suggested members
    const [members, total] = await Promise.all([
      this.memberModel
        .find(matchCriteria)
        .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl organisationInfo.industries organisationInfo.address')
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.memberModel.countDocuments(matchCriteria),
    ]);
    
    this.logger.log(`Found ${total} matching members, returning ${members.length} for page ${page}`);
    // Calculate mutual connections for each suggested member
    const suggestedMembers = await Promise.all(
      members.map(async (member: any) => {
        // Find mutual connections using memberId
        const mutualConnections = await this.findMutualConnections(currentMemberId, member.memberId);

        return {
          member: member,
          mutualConnections: mutualConnections.length,
          matchReason: this.getMatchReason(currentMember, member),
        };
      }),
    );

    // Sort by mutual connections count (descending)
    suggestedMembers.sort((a, b) => b.mutualConnections - a.mutualConnections);

    return {
      members: suggestedMembers,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Find mutual connections between two users using memberId
   */
  private async findMutualConnections(memberId1: string, memberId2: string): Promise<string[]> {
    // Get connections of member1
    const member1Connections = await this.connectionModel
      .find({
        $or: [{ requesterId: memberId1 }, { recipientId: memberId1 }],
        status: ConnectionStatus.ACCEPTED,
      })
      .lean();

    const member1ConnectedIds = member1Connections.map((conn: any) =>
      conn.requesterId === memberId1
        ? conn.recipientId
        : conn.requesterId,
    );

    // Get connections of member2
    const member2Connections = await this.connectionModel
      .find({
        $or: [{ requesterId: memberId2 }, { recipientId: memberId2 }],
        status: ConnectionStatus.ACCEPTED,
      })
      .lean();

    const member2ConnectedIds = member2Connections.map((conn: any) =>
      conn.requesterId === memberId2
        ? conn.recipientId
        : conn.requesterId,
    );

    // Find intersection (mutual connections)
    const mutualConnections = member1ConnectedIds.filter(id => member2ConnectedIds.includes(id));

    return mutualConnections;
  }

  /**
   * Determine match reason for suggestion
   */
  private getMatchReason(currentUser: any, suggestedUser: any): string[] {
    const reasons: string[] = [];

    if (currentUser.industry && currentUser.industry === suggestedUser.industry) {
      reasons.push('Same industry');
    }

    if (currentUser.location && currentUser.location === suggestedUser.location) {
      reasons.push('Same location');
    }

    return reasons;
  }

  /**
   * Check if two users are connected
   */
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.connectionModel.findOne({
      $or: [
        { requesterId: new Types.ObjectId(userId1), recipientId: new Types.ObjectId(userId2) },
        { requesterId: new Types.ObjectId(userId2), recipientId: new Types.ObjectId(userId1) },
      ],
      status: ConnectionStatus.ACCEPTED,
    });

    return !!connection;
  }

  /**
   * Send connection request email to recipient
   */
  private async sendConnectionRequestEmail(
    requester: MemberDocument,
    recipient: MemberDocument,
  ): Promise<void> {
    try {
      // Get primary user email from recipient's userSnapshots
      const recipientPrimaryUser = recipient.userSnapshots?.find(u => u.userType === 'Primary');
      if (!recipientPrimaryUser?.email) {
        this.logger.warn(`No primary user email found for recipient ${recipient.memberId}`);
        return;
      }

      // Get requester details
      const requesterPrimaryUser = requester.userSnapshots?.find(u => u.userType === 'Primary');
      const requesterName = requesterPrimaryUser 
        ? `${requesterPrimaryUser.firstName} ${requesterPrimaryUser.lastName}`.trim()
        : requester.memberId;

      const recipientName = recipientPrimaryUser
        ? `${recipientPrimaryUser.firstName} ${recipientPrimaryUser.lastName}`.trim()
        : recipient.memberId;

      const params = {
        recipientName,
        requesterName,
        requesterCompany: requester.organisationInfo?.companyName || requester.memberId,
        requesterMemberId: requester.memberId,
      };

      await this.emailService.sendTemplatedEmail({
        to: recipientPrimaryUser.email,
        templateCode: EmailTemplateCode.CONNECTION_REQUEST_RECEIVED,
        params,
        language: SupportedLanguage.ENGLISH,
      });

      this.logger.log(`✅ Connection request email sent to ${recipientPrimaryUser.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send connection request email: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - email failure shouldn't fail the connection request
    }
  }

  /**
   * Send connection accepted email to requester
   */
  private async sendConnectionAcceptedEmail(
    requester: MemberDocument,
    recipient: MemberDocument,
  ): Promise<void> {
    try {
      // Get primary user email from requester's userSnapshots
      const requesterPrimaryUser = requester.userSnapshots?.find(u => u.userType === 'Primary');
      if (!requesterPrimaryUser?.email) {
        this.logger.warn(`No primary user email found for requester ${requester.memberId}`);
        return;
      }

      // Get recipient details
      const recipientPrimaryUser = recipient.userSnapshots?.find(u => u.userType === 'Primary');
      const requesterName = requesterPrimaryUser
        ? `${requesterPrimaryUser.firstName} ${requesterPrimaryUser.lastName}`.trim()
        : requester.memberId;

      const recipientName = recipientPrimaryUser
        ? `${recipientPrimaryUser.firstName} ${recipientPrimaryUser.lastName}`.trim()
        : recipient.memberId;

      const params = {
        requesterName,
        recipientName,
        recipientCompany: recipient.organisationInfo?.companyName || recipient.memberId,
        recipientMemberId: recipient.memberId,
      };

      await this.emailService.sendTemplatedEmail({
        to: requesterPrimaryUser.email,
        templateCode: EmailTemplateCode.CONNECTION_REQUEST_ACCEPTED,
        params,
        language: SupportedLanguage.ENGLISH,
      });

      this.logger.log(`✅ Connection accepted email sent to ${requesterPrimaryUser.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send connection accepted email: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - email failure shouldn't fail the acceptance
    }
  }
}

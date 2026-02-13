import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { ChatService } from './chat.service';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import { DocumentService } from '../document/document.service';
import {
  SendMessageDto,
  GetConversationsQueryDto,
  GetMessagesQueryDto,
  MarkAsReadDto,
  StarConversationDto,
  BlockUserDto,
  UnblockUserDto,
  DeleteMessageDto,
} from './dto/chat.dto';

@Controller('chat')
@UseGuards(UnifiedAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly documentService: DocumentService,
  ) {}

  /**
   * Send a message
   * POST /wfzo/api/v1/chat/send
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Request() req: ExpressRequest & { user: any }, @Body() dto: SendMessageDto) {
    const email = req.user.email;
    this.logger.log(`User ${email} sending message to ${dto.recipientId}`);

    const message = await this.chatService.sendMessage(email, dto);

    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  /**
   * Get conversations list
   * GET /wfzo/api/v1/chat/conversations
   */
  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  async getConversations(
    @Request() req: ExpressRequest & { user: any },
    @Query() query: GetConversationsQueryDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching conversations`);

    const result = await this.chatService.getConversations(email, query);

    return {
      success: true,
      data: result.conversations,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      },
    };
  }

  /**
   * Get messages with a specific member
   * GET /wfzo/api/v1/chat/messages
   */
  @Get('messages')
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Request() req: ExpressRequest & { user: any },
    @Query() query: GetMessagesQueryDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching messages with ${query.otherMemberId}`);

    const result = await this.chatService.getMessages(email, query);

    return {
      success: true,
      data: result.messages,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      },
      blockStatus: result.blockStatus, // NEW: Include blocking status
    };
  }

  /**
   * Mark messages as read
   * PUT /wfzo/api/v1/chat/mark-read
   */
  @Put('mark-read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Request() req: ExpressRequest & { user: any }, @Body() dto: MarkAsReadDto) {
    const email = req.user.email;
    const logContext = dto.otherUserId 
      ? `from user ${dto.otherUserId}` 
      : `from member ${dto.otherMemberId}`;
    this.logger.log(`User ${email} marking messages as read ${logContext}`);

    const result = await this.chatService.markAsRead(email, dto.otherMemberId, dto.otherUserId);

    return {
      success: true,
      message: 'Messages marked as read',
      data: result,
    };
  }

  /**
   * Upload a file for chat (image or document)
   * POST /wfzo/api/v1/chat/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(@UploadedFile() file: any, @Request() req: ExpressRequest & { user: any }) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const email = req.user.email;
    this.logger.log(`User ${email} uploading file: ${file.originalname}`);

    const uploadedFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    // Determine media kind based on MIME type
    let mediaKind: 'image' | 'document' = 'document';
    if (file.mimetype.startsWith('image/')) {
      mediaKind = 'image';
    }

    // Upload to blob storage using document service
    const result = await this.documentService.upload(uploadedFile, {
      fileName: file.originalname,
      contentType: file.mimetype,
      mediaKind,
      purpose: 'chat-attachment',
      isPublic: false, // Chat attachments should be private
    });

    this.logger.log(`File uploaded successfully: ${result.id}`);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl: result.publicUrl || result.variants?.find((v) => v.key === 'original')?.url,
        fileName: result.fileName,
        fileSize: result.size,
        mimeType: result.contentType,
        type: mediaKind === 'image' ? 'image' : 'document',
      },
    };
  }
  
  /**
   * ============================================
   * STAR / UNSTAR CONVERSATIONS
   * ============================================
   */

  /**
   * Star a conversation
   * POST /wfzo/api/v1/chat/star
   */
  @Post('star')
  @HttpCode(HttpStatus.OK)
  async starConversation(
    @Request() req: ExpressRequest & { user: any },
    @Body() dto: StarConversationDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} starring conversation with ${dto.otherMemberId}${dto.otherUserId ? `/${dto.otherUserId}` : ''}`);

    const result = await this.chatService.starConversation(email, dto.otherMemberId, dto.otherUserId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Unstar a conversation
   * POST /wfzo/api/v1/chat/unstar
   */
  @Post('unstar')
  @HttpCode(HttpStatus.OK)
  async unstarConversation(
    @Request() req: ExpressRequest & { user: any },
    @Body() dto: StarConversationDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} unstarring conversation with ${dto.otherMemberId}${dto.otherUserId ? `/${dto.otherUserId}` : ''}`);

    const result = await this.chatService.unstarConversation(email, dto.otherMemberId, dto.otherUserId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * ============================================
   * BLOCK / UNBLOCK USERS
   * ============================================
   */

  /**
   * Block a user from messaging
   * POST /wfzo/api/v1/chat/block-user
   */
  @Post('block-user')
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Request() req: ExpressRequest & { user: any },
    @Body() dto: BlockUserDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} blocking user ${dto.blockedUserId}`);

    const result = await this.chatService.blockUser(email, dto.blockedUserId, dto.blockedMemberId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Unblock a user
   * POST /wfzo/api/v1/chat/unblock-user
   */
  @Post('unblock-user')
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @Request() req: ExpressRequest & { user: any },
    @Body() dto: UnblockUserDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} unblocking user ${dto.blockedUserId}`);

    const result = await this.chatService.unblockUser(email, dto.blockedUserId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Get list of blocked users
   * GET /wfzo/api/v1/chat/blocked-users
   */
  @Get('blocked-users')
  @HttpCode(HttpStatus.OK)
  async getBlockedUsers(@Request() req: ExpressRequest & { user: any }) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching blocked users list`);

    const users = await this.chatService.getBlockedUsers(email);

    return {
      success: true,
      data: users,
    };
  }

  /**
   * ============================================
   * DELETE MESSAGES
   * ============================================
   */

  /**
   * Delete a message
   * DELETE /wfzo/api/v1/chat/message/:messageId
   */
  @Delete('message/:messageId')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Request() req: ExpressRequest & { user: any },
    @Param('messageId') messageId: string,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} deleting message ${messageId}`);

    const result = await this.chatService.deleteMessage(email, messageId);

    return {
      success: result.success,
      message: result.message,
    };
  }
}

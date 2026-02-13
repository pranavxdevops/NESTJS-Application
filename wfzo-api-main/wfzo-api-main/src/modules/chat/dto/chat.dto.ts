import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @ApiProperty({ 
    description: 'Recipient member ID',
    example: 'MEMBER-002'
  })
  @IsNotEmpty()
  @IsString()
  recipientId!: string; // Member ID

  @ApiPropertyOptional({ 
    description: 'Optional: Recipient user ID from userSnapshots. If provided, message goes to User Chat. If omitted and sender is Primary, goes to Member Chat.',
    example: 'user-456'
  })
  @IsOptional()
  @IsString()
  recipientUserId?: string;

  @ApiProperty({ 
    description: 'Message content (text or file description)',
    example: 'Hello! How are you?'
  })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ 
    description: 'Message type',
    enum: MessageType,
    example: 'text'
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ 
    description: 'File URL (required for image/document types)',
    example: 'https://storage.blob.core.windows.net/...'
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Original file name (required for image/document types)',
    example: 'document.pdf'
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ 
    description: 'File size in bytes (required for image/document types)',
    example: 102400
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ 
    description: 'MIME type (required for image/document types)',
    example: 'application/pdf'
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class GetConversationsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Page number',
    example: '1',
    default: '1'
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    example: '10',
    default: '10'
  })
  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class GetMessagesQueryDto {
  @ApiProperty({ 
    description: 'Member ID of the other party',
    example: 'MEMBER-002'
  })
  @IsNotEmpty()
  @IsString()
  otherMemberId!: string;

  @ApiPropertyOptional({ 
    description: 'Optional: User ID from userSnapshots for user-to-user chat. If omitted, shows Member Chat only.',
    example: 'user-456'
  })
  @IsOptional()
  @IsString()
  otherUserId?: string;

  @ApiPropertyOptional({ 
    description: 'Page number',
    example: '1',
    default: '1'
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    example: '50',
    default: '50'
  })
  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ 
    description: 'Member ID of the other party',
    example: 'MEMBER-002'
  })
  @IsNotEmpty()
  @IsString()
  otherMemberId!: string;

  @ApiPropertyOptional({ 
    description: 'Optional: User ID from userSnapshots for user-to-user chat',
    example: 'user-456'
  })
  @IsOptional()
  @IsString()
  otherUserId?: string;
}

export class StarConversationDto {
  @ApiProperty({ 
    description: 'Member ID of the other party',
    example: 'MEMBER-002'
  })
  @IsNotEmpty()
  @IsString()
  otherMemberId!: string;

  @ApiPropertyOptional({ 
    description: 'Optional: User ID from userSnapshots for user-to-user chat',
    example: 'user-456'
  })
  @IsOptional()
  @IsString()
  otherUserId?: string;
}

export class BlockUserDto {
  @ApiProperty({ 
    description: 'User ID to block',
    example: 'user-456'
  })
  @IsNotEmpty()
  @IsString()
  blockedUserId!: string;

  @ApiProperty({ 
    description: 'Member ID of the user to block',
    example: 'MEMBER-002'
  })
  @IsNotEmpty()
  @IsString()
  blockedMemberId!: string;
}

export class UnblockUserDto {
  @ApiProperty({ 
    description: 'User ID to unblock',
    example: 'user-456'
  })
  @IsNotEmpty()
  @IsString()
  blockedUserId!: string;
}

export class DeleteMessageDto {
  @ApiProperty({ 
    description: 'Message ID to delete',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsString()
  messageId!: string;
}

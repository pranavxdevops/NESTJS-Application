import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportMemberDto {
  @ApiProperty({
    description: 'Member ID being reported',
    example: 'MEMBER-016',
  })
  @IsString()
  @IsNotEmpty()
  reportedMemberId!: string;

  @ApiProperty({
    description: 'User ID being reported (optional - for user-level reports)',
    example: '6052d5b4-663a-447a-a203-c2adbd24b61c',
    required: false,
  })
  @IsString()
  @IsOptional()
  reportedUserId?: string;

  @ApiProperty({
    description: 'Reason for the report',
    example: 'Sending unsolicited promotional messages',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

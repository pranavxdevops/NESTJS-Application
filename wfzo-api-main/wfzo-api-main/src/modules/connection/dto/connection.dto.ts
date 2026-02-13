import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendConnectionRequestDto {
  @IsNotEmpty()
  @IsString()
  recipientId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateConnectionStatusDto {
  @IsNotEmpty()
  @IsString()
  status!: 'accepted' | 'rejected' | 'blocked';
}

export class GetConnectionsQueryDto {
  @IsOptional()
  @IsString()
  status?: 'pending' | 'accepted' | 'rejected' | 'blocked';

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class GetSuggestedMembersQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class BlockMemberDto {
  @IsNotEmpty()
  @IsString()
  blockedMemberId!: string; // Member ID to block
}

export class UnblockMemberDto {
  @IsNotEmpty()
  @IsString()
  unblockedMemberId!: string; // Member ID to unblock
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import {
  ValidateEmailUnique,
} from "../validators/decorators/validate-email-unique.decorator";

export enum UserType {
  PRIMARY = "Primary",
  SECONDARY = "Secondry", // Keep typo for backward compatibility
  NON_MEMBER = "Non Member",
  INTERNAL = "Internal",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

/**
 * User information sent from UI when creating/updating a member
 * This replaces the old approach of just sending user UUIDs
 */
export class MemberUserDto {
  @ApiPropertyOptional({
    description: "User ID (if updating existing user). Omit when creating new user.",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: "Username (email format)",
    example: "john.doe@example.com",
  })
  @IsEmail()
  username!: string;

  @ApiProperty({
    description: "Email address",
    example: "john.doe@example.com",
  })
  @IsEmail()
  @ValidateEmailUnique({
    // message: "Email '$value' is already registered. Please use a different email address.",
  })
  email!: string;

  @ApiPropertyOptional({
    description: "First name",
    example: "John",
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: "Last name",
    example: "Doe",
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: "User type within the organization",
    enum: UserType,
    example: UserType.PRIMARY,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @ApiPropertyOptional({
    description: "Job title/designation",
    example: "Chief Technology Officer",
  })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    description: "Contact phone number",
    example: "+1-555-0123",
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional({
    description: "Is this the primary correspondence user for the organization?",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  correspondanceUser?: boolean;

  @ApiPropertyOptional({
    description: "Is this the marketing focal point for the organization?",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  marketingFocalPoint?: boolean;

  @ApiPropertyOptional({
    description: "Is this the investor relations focal point for the organization?",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  investorFocalPoint?: boolean;

  @ApiPropertyOptional({
    description: "User status",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    description: "Newsletter subscription preference",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  newsLetterSubscription?: boolean;
}

/**
 * Response DTO for user snapshot data stored in member
 */
export class UserSnapshotResponseDto {
  @ApiProperty({ description: "User ID", example: "123e4567-e89b-12d3-a456-426614174001" })
  id!: string;

  @ApiProperty({ description: "Email address", example: "john.doe@example.com" })
  email!: string;

  @ApiPropertyOptional({ description: "First name", example: "John" })
  firstName?: string;

  @ApiPropertyOptional({ description: "Last name", example: "Doe" })
  lastName?: string;

  @ApiPropertyOptional({ description: "User type", enum: UserType })
  userType?: UserType;

  @ApiPropertyOptional({ description: "Is correspondence user", example: true })
  correspondanceUser?: boolean;

  @ApiPropertyOptional({ description: "Is marketing focal point", example: false })
  marketingFocalPoint?: boolean;

  @ApiPropertyOptional({ description: "Is investor focal point", example: false })
  investorFocalPoint?: boolean;

  @ApiPropertyOptional({ description: "Contact phone number", example: "+1-555-0123" })
  contactNumber?: string;

  @ApiPropertyOptional({ description: "Newsletter subscription preference", example: true })
  newsLetterSubscription?: boolean;

  @ApiPropertyOptional({ description: "Profile image URL", example: "https://cdn.example.com/profile.png" })
  profileImageUrl?: string;
  
  @ApiPropertyOptional({ description: "Designation", example: "Chief Technology Officer" })
  designation?: string;
  @ApiPropertyOptional({ description: "Last synced timestamp", type: String })
  lastSyncedAt?: Date;
}

/**
 * DTO for adding/updating a user snapshot in a member's userSnapshots array
 */
export class AddUserSnapshotDto {
  @ApiProperty({
    description: "Action to perform: 'addUser' to create new snapshot, 'editUser' to update existing",
    example: "addUser",
    enum: ["addUser", "editUser"],
  })
  @IsString()
  action!: "addUser" | "editUser";

  @ApiProperty({
    description: "Email address (required for addUser, optional for editUser)",
    example: "user@example.com",
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: "User snapshot ID (required for editUser to identify which snapshot to update)",
    example: "507f1f77bcf86cd799439011",
  })
  @IsString()
  @IsOptional()
  userSnapshotId?: string;

  @ApiPropertyOptional({
    description: "First name",
    example: "New",
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: "Last name",
    example: "User",
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: "User type within the organization",
    enum: UserType,
    example: UserType.SECONDARY,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @ApiPropertyOptional({
    description: "Job title/designation",
    example: "Software Engineer",
  })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    description: "Contact phone number",
    example: "+971555555555",
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional({
    description: "Newsletter subscription preference",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  newsLetterSubscription?: boolean;

  @ApiPropertyOptional({
    description: "Profile image URL for updating existing snapshots",
    example: "https://cdn.example.com/profile.png",
  })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}

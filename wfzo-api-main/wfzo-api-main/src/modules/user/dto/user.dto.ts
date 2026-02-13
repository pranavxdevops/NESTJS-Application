// User DTOs based on api-spec
import type { EntitlementsMap } from "@modules/membership/dto/membership.dto";

export type UserType = "Primary" | "Secondry" | "Non Member" | "Internal";

export interface User {
  username: string;
  password?: string;
  email: string;
  memberId?: string; // uuid
  userType?: UserType;
  isMember?: boolean;
  newsLetterSubscription?: boolean;
  firstName?: string;
  lastName?: string;
  // Fields from API spec
  correspondanceUser?: boolean;
  marketingFocalPoint?: boolean;
  investorFocalPoint?: boolean;
  designation?: string;
  contactNumber?: string;
  displayName?: string;
  phone?: string;
  title?: string;
  avatarUrl?: string;
  status?: "active" | "inactive" | "suspended";
  preferences?: Record<string, unknown>;
  createdAt?: string; // ISO date-time
  updatedAt?: string; // ISO date-time
}

// Validation DTOs for controller
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUrl, IsObject } from "class-validator";

// Use User as the single source of truth; this DTO is only for validation on create.
export class CreateUserDto implements Partial<User> {
  @IsEmail()
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  userType?: UserType;

  @IsOptional()
  @IsBoolean()
  isMember?: boolean;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  newsLetterSubscription?: boolean;

  // Spec fields
  @IsOptional()
  @IsBoolean()
  correspondanceUser?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingFocalPoint?: boolean;

  @IsOptional()
  @IsBoolean()
  investorFocalPoint?: boolean;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(["active", "inactive", "suspended"])
  status?: "active" | "inactive" | "suspended";

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}

// New DTO for the updated POST /user endpoint
export class CreateUserWithEntraDto {
  @IsEmail()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  userType?: UserType;
}

export class UpdateProfileDto implements UpdateProfileRequest {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  newsLetterSubscription?: boolean;

  // Spec fields
  @IsOptional()
  @IsBoolean()
  correspondanceUser?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingFocalPoint?: boolean;

  @IsOptional()
  @IsBoolean()
  investorFocalPoint?: boolean;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(["active", "inactive", "suspended"])
  status?: "active" | "inactive" | "suspended";

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}

import type { PageData as SharedPageData } from "@shared/common/pagination";
export type PageData = SharedPageData;

export interface UserSearchQuery {
  username?: string;
  userType?: UserType;
  membershipType?: string;
  page?: number;
  pageSize?: number;
}

export interface UserSearchData {
  items: User[];
  page: PageData;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  newsLetterSubscription?: boolean;
  // Spec fields
  correspondanceUser?: boolean;
  marketingFocalPoint?: boolean;
  investorFocalPoint?: boolean;
  designation?: string;
  contactNumber?: string;
}

export interface UserInfo {
  id: string; // uuid
  username: string; // email
}

export interface UserAccess {
  user: UserInfo;
  membershipId: string; // uuid
  entitlements: EntitlementsMap;
  generatedAt: string; // ISO date-time
}

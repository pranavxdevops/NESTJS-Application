import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, IsNumber } from "class-validator";
import { EnquiryType } from "../schemas/enquiry.schema";

export class UserDetailsDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  organizationName!: string;

  @IsString()
  country!: string;

  @IsString()
  phoneNumber!: string;

  @IsEmail()
  email!: string;
}

export class CreateEnquiryDto {
  @IsOptional()
  userDetails?: UserDetailsDto;

  @IsOptional()
  @IsEnum(EnquiryType)
  enquiryType?: EnquiryType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsNumber({}, { message: "No of members must be a number" })
  noOfMembers?: number;

  @IsOptional()
  @IsString()
  memberId?: string; // Reference to member ID (e.g., "MEMBER-008")
}

import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum OrganizationEmailType {
  ORGANIZATION_APPROVED_USER = "ORGANIZATION_APPROVED_USER",
  ORGANIZATION_REJECTED_USER = "ORGANIZATION_REJECTED_USER",
}

export class SendOrganizationEmailRequest {
  @ApiProperty({ description: "User email address to send to" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    enum: OrganizationEmailType,
    description: "Type of email to send",
    example: OrganizationEmailType.ORGANIZATION_APPROVED_USER,
  })
  @IsEnum(OrganizationEmailType)
  type!: OrganizationEmailType;

  @ApiProperty({ description: "Organization title" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: "Organization description" })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: "Organizer name" })
  @IsString()
  @IsNotEmpty()
  organizerName!: string;
  @ApiProperty({ description: "Rejection reason (optional)" })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class SendOrganizationEmailResponse {
  @ApiProperty({ description: "Success message" })
  message!: string;
}

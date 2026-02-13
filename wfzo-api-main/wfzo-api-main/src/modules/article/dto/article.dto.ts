import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Enums
export enum ArticleEmailType {
  ARTICLE_SUBMITTED_FOR_APPROVAL = "ARTICLE_SUBMITTED_FOR_APPROVAL",
  ARTICLE_APPROVED_USER = "ARTICLE_APPROVED_USER",
  ARTICLE_REJECTED_USER = "ARTICLE_REJECTED_USER",
}

// Request DTOs
export class SendArticleEmailRequest {
  @ApiProperty({ description: "User email address to send to" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    enum: ArticleEmailType,
    description: "Type of email to send",
    example: ArticleEmailType.ARTICLE_APPROVED_USER
  })
  @IsEnum(ArticleEmailType)
  type!: ArticleEmailType;

  @ApiProperty({ description: "Article title" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: "Article description" })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: "Article short description" })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({ description: "Article category" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: "Organizer name" })
  @IsString()
  @IsNotEmpty()
  organizerName!: string;

  @ApiPropertyOptional({ description: "Article type" })
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiPropertyOptional({ description: "Rejection reason" })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: "User first name" })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: "User last name" })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class SendArticleEmailResponse {
  @ApiProperty({ description: "Success message" })
  message!: string;
}
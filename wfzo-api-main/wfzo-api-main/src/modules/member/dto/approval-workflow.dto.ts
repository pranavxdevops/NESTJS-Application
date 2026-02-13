import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export enum ApprovalStage {
  COMMITTEE = "committee",
  BOARD = "board",
  CEO = "ceo",
}

export enum RejectionStage {
  COMMITTEE = "committee",
  BOARD = "board",
  CEO = "ceo",
  ADMIN = "admin",
}

/**
 * Approval history entry DTO
 */
export class ApprovalHistoryEntryDto {
  @ApiProperty({
    description: "Stage at which approval was given",
    enum: ApprovalStage,
    example: ApprovalStage.COMMITTEE,
  })
  @IsEnum(ApprovalStage)
  approvalStage!: ApprovalStage;

  @ApiProperty({
    description: "Username or identifier of the person who approved",
    example: "john.doe",
  })
  @IsString()
  approvedBy!: string;

  @ApiProperty({
    description: "Email of the person who approved",
    example: "john.doe@worldfzo.org",
  })
  @IsEmail()
  approverEmail!: string;

  @ApiPropertyOptional({
    description: "Optional comments from the approver",
    example: "Application meets all criteria. Approved.",
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiProperty({
    description: "Timestamp when approval was given",
    type: String,
    format: "date-time",
    example: "2025-11-07T10:30:00Z",
  })
  approvedAt!: Date;
}

/**
 * Rejection history entry DTO
 */
export class RejectionHistoryEntryDto {
  @ApiProperty({
    description: "Stage at which rejection occurred",
    enum: RejectionStage,
    example: RejectionStage.COMMITTEE,
  })
  @IsEnum(RejectionStage)
  rejectionStage!: RejectionStage;

  @ApiProperty({
    description: "Username or identifier of the person who rejected",
    example: "jane.smith",
  })
  @IsString()
  rejectedBy!: string;

  @ApiProperty({
    description: "Email of the person who rejected",
    example: "jane.smith@worldfzo.org",
  })
  @IsEmail()
  rejectorEmail!: string;

  @ApiProperty({
    description: "Reason for rejection (max 2000 characters)",
    example: "Company does not meet minimum revenue requirements.",
  })
  @IsString()
  @MaxLength(2000)
  reason!: string;

  @ApiProperty({
    description: "Timestamp when rejection occurred",
    type: String,
    format: "date-time",
    example: "2025-11-07T10:30:00Z",
  })
  rejectedAt!: Date;
}

/**
 * DTO for updating member status with approval/rejection
 */
export class UpdateStatusDto {
  @ApiProperty({
    description: "Action to perform",
    enum: ["approve", "reject"],
    example: "approve",
  })
  @IsEnum(["approve", "reject"])
  action!: "approve" | "reject";

  @ApiProperty({
    description: "Username or identifier of the person performing the action",
    example: "admin@worldfzo.org",
  })
  @IsString()
  actionBy!: string;

  @ApiProperty({
    description: "Email of the person performing the action",
    example: "admin@worldfzo.org",
  })
  @IsEmail()
  actionByEmail!: string;

  @ApiPropertyOptional({
    description: "Comments (required for rejection, optional for approval)",
    example: "All documentation verified and approved.",
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  comments?: string;

}

/**
 * DTO for updating payment link
 */
export class UpdatePaymentLinkDto {
  @ApiProperty({
    description: "Payment link URL",
    example: "https://payment.worldfzo.org/pay/MEMBER-001",
  })
  @IsUrl()
  paymentLink!: string;

  @ApiProperty({
    description: "Payment status",
    enum: ["pending", "paid", "failed"],
    example: "pending",
  })
  @IsEnum(["pending", "paid", "failed"])
  paymentStatus?: "pending" | "paid" | "failed";
}

/**
 * DTO for updating payment status
 */
export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: "Payment status",
    enum: ["pending", "paid", "failed"],
    example: "paid",
  })
  @IsEnum(["pending", "paid", "failed"])
  paymentStatus!: "pending" | "paid" | "failed";
}

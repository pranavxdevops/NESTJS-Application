import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { RequestStatus } from "@modules/requests/schemas/request.schema";

/**
 * DTO for updating request status (admin only)
 * Admin provides new status and mandatory comments if changing to APPROVED/REJECTED
 * No comments required for DRAFT or PENDING status
 */
export class UpdateRequestDto {
  @ApiProperty({
    enum: RequestStatus,
    description:
      "New status for the request. APPROVED and REJECTED require comments to be provided. DRAFT and PENDING do not require comments.",
    example: RequestStatus.APPROVED,
  })
  @IsEnum(RequestStatus, {
    message: `requestStatus must be one of: ${Object.values(RequestStatus).join(", ")}`,
  })
  @IsNotEmpty()
  requestStatus!: RequestStatus;

  @ApiProperty({
    description:
      "Comments/reason for approval or rejection. Required when status is APPROVED or REJECTED.",
    example: "Approved after verification",
    required: false,
  })
  @ValidateIf(
    (o) => o.requestStatus === RequestStatus.APPROVED || o.requestStatus === RequestStatus.REJECTED,
  )
  @IsString({ message: "comments must be a string" })
  @IsNotEmpty({
    message: "comments are required when approving or rejecting a request",
  })
  comments?: string;
}

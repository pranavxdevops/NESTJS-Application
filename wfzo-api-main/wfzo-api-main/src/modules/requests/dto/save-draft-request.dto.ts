import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString } from "class-validator";

/**
 * DTO for saving a draft request
 * Users can save incomplete organizationInfo updates as drafts
 * No validation required - allows partial/incomplete data
 */
export class SaveDraftRequestDto {
  @ApiProperty({
    description: "Partial or complete organizationInfo fields to save as draft",
    type: Object,
    example: {
      companyName: "Draft Company",
      websiteUrl: "https://draft-website.com",
      industries: ["software"],
    },
  })
  @IsObject()
  @IsNotEmpty({ message: "organisationInfo is required" })
  organisationInfo!: Record<string, any>;

  @ApiProperty({
    description: "Member ID saving the draft (e.g., MEMBER-001)",
    example: "MEMBER-001",
  })
  @IsString()
  @IsNotEmpty({ message: "memberId is required" })
  memberId!: string;
}

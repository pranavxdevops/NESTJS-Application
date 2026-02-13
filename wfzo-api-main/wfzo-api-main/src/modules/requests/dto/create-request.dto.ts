import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString } from "class-validator";

/**
 * DTO for creating a new organizationInfo update request
 * Frontend submits only organizationInfo and memberId
 * Server enforces PENDING status and validates member exists
 */
export class CreateRequestDto {
  @ApiProperty({
    description: "Copy of organizationInfo fields to update",
    type: Object,
    example: {
      companyName: "Updated Corp Name",
      websiteUrl: "https://newwebsite.com",
      industries: ["software", "consulting"],
      address: {
        line1: "123 New Street",
        city: "New City",
        state: "NY",
        country: "USA",
      },
      linkedInUrl: "https://linkedin.com/company/newcorp",
    },
  })
  @IsObject()
  @IsNotEmpty({ message: "organizationInfo is required" })
  organisationInfo!: Record<string, any>;

  @ApiProperty({
    description: "Member ID requesting the update (e.g., MEMBER-001)",
    example: "MEMBER-001",
  })
  @IsString()
  @IsNotEmpty({ message: "memberId is required" })
  memberId!: string;
}

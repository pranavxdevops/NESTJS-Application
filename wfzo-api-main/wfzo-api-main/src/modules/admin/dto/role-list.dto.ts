import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for role list response (simplified for UI dropdowns/selection)
 */
export class RoleListItemDto {
  @ApiProperty({ 
    description: "Role code/identifier (e.g., ADMIN, FINANCE)",
    example: "MEMBERSHIP_COMMITTEE"
  })
  code!: string;

  @ApiProperty({ 
    description: "Human-readable role name",
    example: "Membership Committee"
  })
  name!: string;

  @ApiProperty({ 
    description: "Role description",
    example: "Can view member details and approve/reject membership applications",
    required: false
  })
  description?: string;

  @ApiProperty({ 
    description: "Number of privileges this role has",
    example: 5
  })
  privilegeCount!: number;
}

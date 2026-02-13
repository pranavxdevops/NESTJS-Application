import { ApiProperty } from "@nestjs/swagger";
import { Privilege } from "../schemas/role.schema";

/**
 * DTO for Role response
 */
export class RoleDto {
  @ApiProperty({ description: "Role code (e.g., ADMIN, FINANCE)", example: "ADMIN" })
  name!: string;

  @ApiProperty({ description: "Human-readable role name" })
  displayName!: string;

  @ApiProperty({ description: "Role description", required: false })
  description?: string;

  @ApiProperty({
    enum: Privilege,
    isArray: true,
    description: "List of privileges granted by this role",
  })
  privileges!: Privilege[];

  @ApiProperty({ description: "Whether role is active" })
  isActive!: boolean;

  @ApiProperty({ description: "Role priority (higher = more important)" })
  priority!: number;
}

/**
 * DTO for getting all roles and privileges
 */
export class RolesAndPrivilegesDto {
  @ApiProperty({ type: [RoleDto], description: "List of all roles with their privileges" })
  roles!: RoleDto[];

  @ApiProperty({
    enum: Privilege,
    isArray: true,
    description: "List of all available privileges in the system",
  })
  allPrivileges!: Privilege[];

  @ApiProperty({
    type: Object,
    description: "Privilege descriptions for UI display",
    example: {
      "users:create": "Create new users",
      "users:read": "View user details",
      "members:approve": "Approve membership applications",
    },
  })
  privilegeDescriptions!: Record<string, string>;
}

/**
 * DTO for assigning roles to a user
 */
export class AssignRolesDto {
  @ApiProperty({
    type: [String],
    isArray: true,
    description: "List of role codes to assign to the user",
    example: ["MEMBERSHIP_COMMITTEE", "FINANCE"],
  })
  roles!: string[];
}

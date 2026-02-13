import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";
import { Privilege } from "../schemas/role.schema";

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @ApiProperty({
    description: "Role code (uppercase, letters and underscores only)",
    example: "REGIONAL_MANAGER",
    pattern: "^[A-Z_]+$",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, { message: "Role name must be uppercase letters and underscores only" })
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: "Human-readable display name",
    example: "Regional Manager",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @ApiProperty({
    description: "Role description",
    example: "Can manage regional operations and approve requests",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    enum: Privilege,
    isArray: true,
    description: "List of privileges to grant to this role",
    example: [Privilege.MEMBERS_READ, Privilege.MEMBERS_UPDATE],
  })
  @IsArray()
  @IsEnum(Privilege, { each: true })
  privileges!: Privilege[];

  @ApiProperty({
    description: "Role priority (higher = more important)",
    example: 50,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiProperty({
    description: "Whether the role is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for updating an existing role
 */
export class UpdateRoleDto {
  @ApiProperty({
    description: "Human-readable display name",
    example: "Regional Manager",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({
    description: "Role description",
    example: "Can manage regional operations and approve requests",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    enum: Privilege,
    isArray: true,
    description: "List of privileges to grant to this role",
    example: [Privilege.MEMBERS_READ, Privilege.MEMBERS_UPDATE],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Privilege, { each: true })
  privileges?: Privilege[];

  @ApiProperty({
    description: "Role priority (higher = more important)",
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiProperty({
    description: "Whether the role is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export class RoleDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsString()
  name!: string;
}

export class InternalUserDto {
  @ApiProperty({ format: "uuid" })
  @IsString()
  id!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ 
    type: [String], 
    isArray: true,
    description: "Array of role codes assigned to the user",
    example: ["ADMIN", "FINANCE"]
  })
  @IsArray()
  @IsString({ each: true })
  roles!: string[];

  @ApiProperty({ enum: ["active", "disabled"] })
  @IsEnum(["active", "disabled"] as const)
  status!: "active" | "disabled";
}

export class InternalUserCreateRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ 
    type: [String], 
    isArray: true,
    description: "Array of role codes to assign to the user (e.g., ADMIN, FINANCE)",
    example: ["MEMBERSHIP_COMMITTEE", "FINANCE"]
  })
  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}

export class InternalUserUpdateRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ 
    required: false, 
    type: [String],
    isArray: true,
    description: "Array of role codes to assign to the user"
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({ required: false, enum: ["active", "disabled"] })
  @IsOptional()
  @IsEnum(["active", "disabled"] as const)
  status?: "active" | "disabled";
}

export class PageDataDto {
  @ApiProperty()
  total!: number;
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
}

export class InternalUserListDataDto {
  @ApiProperty({ type: [InternalUserDto] })
  items!: InternalUserDto[];
  @ApiProperty({ type: PageDataDto })
  page!: PageDataDto;
}

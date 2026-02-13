import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export enum QuotaWindow {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
  PER_EVENT = "per-event",
}

export enum AccessLevel {
  NONE = "none",
  RESTRICTED = "restricted",
  UNLIMITED = "unlimited",
  PAYMENT = "payment",
  APPROVAL = "approval",
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FLAT = "flat",
}

export class QuotaDto {
  @ApiProperty({ description: "Type of quota (e.g., seats, downloads, views)", example: "seats" })
  @IsString()
  @IsNotEmpty()
  kind!: string;

  @ApiPropertyOptional({
    description: "Maximum allowed in the window (null = not set)",
    example: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number | null;

  @ApiProperty({ description: "Amount already used", example: 25, default: 0 })
  @IsNumber()
  @Min(0)
  used!: number;

  @ApiPropertyOptional({
    description: "Remaining quota (computed server-side)",
    example: 75,
    readOnly: true,
  })
  @IsOptional()
  @IsNumber()
  remaining?: number;

  @ApiPropertyOptional({
    description: "Scope of the limit/reset policy",
    example: "monthly",
  })
  @IsOptional()
  @IsString()
  window?: string;

  @ApiPropertyOptional({
    description: "When the quota resets (ISO date-time)",
    example: "2025-12-01T00:00:00Z",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  resetsAt?: string | null;
}

export class MonetaryDto {
  @ApiProperty({ description: "Whether payment is required", example: true, default: true })
  @IsBoolean()
  paymentRequired!: boolean;

  @ApiPropertyOptional({
    description: "Whether discount is available",
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  discountAvailable?: boolean;

  @ApiPropertyOptional({
    description: "Type of discount",
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType | null;

  @ApiPropertyOptional({
    description: "Percentage (e.g., 10) or flat amount depending on discountType",
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: "Currency code", example: "USD" })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ApprovalDto {
  @ApiProperty({ description: "Whether approval is required", example: true, default: true })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({ description: "Approval authority", example: "admin" })
  @IsOptional()
  @IsString()
  authority?: string;

  @ApiPropertyOptional({
    description: "Approval status",
    example: "pending",
    default: "pending",
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class EntitlementDto {
  @ApiProperty({
    description: "Access level for the feature",
    enum: AccessLevel,
    example: AccessLevel.RESTRICTED,
  })
  @IsEnum(AccessLevel)
  @IsNotEmpty()
  access!: AccessLevel;

  @ApiPropertyOptional({
    description: "Quota limits (present when access=restricted)",
    type: QuotaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuotaDto)
  quota?: QuotaDto;

  @ApiPropertyOptional({
    description: "Payment and discount information (present when access=payment)",
    type: MonetaryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonetaryDto)
  monetary?: MonetaryDto;

  @ApiPropertyOptional({
    description: "Approval workflow data (present when access=approval)",
    type: ApprovalDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApprovalDto)
  approval?: ApprovalDto;

  @ApiPropertyOptional({
    description: "Additional notes about this entitlement",
    example: "20% discount on paid courses",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMembershipDto {
  @ApiProperty({
    description: "Unique membership type identifier",
    example: "premium",
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    description: "Map of feature keys to entitlement objects",
    type: "object",
    additionalProperties: { $ref: "#/components/schemas/EntitlementDto" },
    example: {
      "events.seats": {
        access: "restricted",
        quota: {
          kind: "seats",
          limit: 100,
          used: 0,
          remaining: 100,
          window: "per-event",
        },
      },
      "library.downloads": {
        access: "restricted",
        quota: {
          kind: "downloads",
          limit: 500,
          used: 0,
          remaining: 500,
          window: "monthly",
        },
      },
    },
  })
  @IsObject()
  entitlements!: Record<string, EntitlementDto>;

  @ApiPropertyOptional({
    description: "Optional description of the membership type",
    example: "Premium membership with full access to all features",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

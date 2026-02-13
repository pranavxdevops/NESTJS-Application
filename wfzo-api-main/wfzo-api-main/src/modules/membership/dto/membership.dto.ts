// Membership DTOs aligned to api-spec components for Access/Entitlements
import { ApiProperty } from "@nestjs/swagger";

export type AccessLevel = "none" | "restricted" | "unlimited" | "payment" | "approval";

export interface Quota {
  kind: string; // e.g., seats, downloads, views
  limit: number | null; // null = not set
  used: number;
  remaining: number; // computed server-side
  window?: string; // e.g., per-event, monthly, yearly
  resetsAt?: string | null; // ISO date-time
}

export type DiscountType = "percentage" | "flat" | null;

export interface Monetary {
  paymentRequired: boolean;
  discountAvailable?: boolean;
  discountType?: DiscountType;
  discountValue?: number; // percentage (e.g., 10) or flat amount
  currency?: string; // e.g., USD
}

export interface Approval {
  required: boolean;
  authority?: string; // e.g., admin
  status?: string; // e.g., pending/approved/rejected
}

export interface Entitlement {
  access: AccessLevel;
  quota?: Quota;
  monetary?: Monetary;
  approval?: Approval;
  notes?: string;
}

export type EntitlementsMap = Record<string, Entitlement>;

export class MembershipFeatures {
  @ApiProperty({
    description: "Requested membership type key",
    example: "premium",
  })
  type!: string;

  @ApiProperty({
    description: "Map of feature keys to entitlement objects",
    additionalProperties: true,
    example: {
      "events.seats": {
        access: "restricted",
        quota: {
          kind: "seats",
          limit: 100,
          used: 25,
          remaining: 75,
          window: "per-event",
        },
      },
    },
  })
  entitlements!: EntitlementsMap;

  @ApiProperty({
    description: "Timestamp when these features were generated (ISO date-time)",
    example: "2025-10-18T10:30:00Z",
  })
  generatedAt!: string;
}

export class MembershipFeaturesResponse {
  @ApiProperty({ description: "HTTP status code", example: 200 })
  code!: number;

  @ApiProperty({ description: "Response type", example: "success" })
  type!: string;

  @ApiProperty({ description: "Response message", example: "Operation successful" })
  message!: string;

  @ApiProperty({ type: MembershipFeatures })
  data!: MembershipFeatures;
}

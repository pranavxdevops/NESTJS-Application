/**
 * Membership Features Types
 * Aligned with backend API /membership/features/:type
 */

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
  authenticationRequired?: boolean; // Custom field for frontend restrictions
  quota?: Quota;
  monetary?: Monetary;
  approval?: Approval;
  notes?: string;
}

export type EntitlementsMap = Record<string, Entitlement>;

export interface MembershipFeatures {
  type: string;
  description?: string;
  entitlements: EntitlementsMap;
  generatedAt?: string;
}

/**
 * Feature access result for UI components
 */
export interface FeatureAccess {
  allowed: boolean;
  requiresAuth: boolean;
  requiresUpgrade: boolean;
  message?: string;
  upgradeUrl?: string;
}

/**
 * Common feature keys used across the application
 */
export const FEATURE_KEYS = {
  EVENTS_SEATS: "events.seats",
  LIBRARY_DOWNLOADS: "library.downloads",
  LIBRARY_MEMBER_NEWS: "library.memberNews",
  NETWORK: "network",
  KNOWLEDGE_ATLAS: "knowledge.atlas",
} as const;

/**
 * Membership types
 */
export const MEMBERSHIP_TYPES = {
  GUEST: "guest",
  VOTING_MEMBER: "votingMember",
  ASSOCIATE_MEMBER: "associateMember",
} as const;

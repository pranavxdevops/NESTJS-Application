import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

/**
 * Privilege enum - defines all possible actions in the system
 */
export enum Privilege {
  // User Management
  USERS_CREATE = "users:create",
  USERS_READ = "users:read",
  USERS_UPDATE = "users:update",
  USERS_DELETE = "users:delete",

  // Member Management
  MEMBERS_CREATE = "members:create",
  MEMBERS_READ = "members:read",
  MEMBERS_UPDATE = "members:update",
  MEMBERS_DELETE = "members:delete",
  MEMBERS_APPROVE = "members:approve",
  MEMBERS_REJECT = "members:reject",

  // Payment Management
  PAYMENT_ADD_LINK = "payment:add_link",
  PAYMENT_UPDATE_STATUS = "payment:update_status",
  PAYMENT_READ = "payment:read",

  // Events Management
  EVENTS_CREATE = "events:create",
  EVENTS_READ = "events:read",
  EVENTS_UPDATE = "events:update",
  EVENTS_DELETE = "events:delete",

  // Documents Management
  DOCUMENTS_CREATE = "documents:create",
  DOCUMENTS_READ = "documents:read",
  DOCUMENTS_UPDATE = "documents:update",
  DOCUMENTS_DELETE = "documents:delete",

  // Master Data Management
  MASTERDATA_READ = "masterdata:read",
  MASTERDATA_UPDATE = "masterdata:update",

  // System Administration
  SYSTEM_ADMIN = "system:admin",
}

/**
 * Privilege descriptions for UI display
 * Centralized definition - single source of truth
 */
export const PRIVILEGE_DESCRIPTIONS: Record<Privilege, string> = {
  // User Management
  [Privilege.USERS_CREATE]: "Create new portal users",
  [Privilege.USERS_READ]: "View portal user details",
  [Privilege.USERS_UPDATE]: "Update portal user information",
  [Privilege.USERS_DELETE]: "Delete portal users",

  // Member Management
  [Privilege.MEMBERS_CREATE]: "Create new member applications",
  [Privilege.MEMBERS_READ]: "View member listing and details",
  [Privilege.MEMBERS_UPDATE]: "Update member information",
  [Privilege.MEMBERS_DELETE]: "Delete members",
  [Privilege.MEMBERS_APPROVE]: "Approve membership applications",
  [Privilege.MEMBERS_REJECT]: "Reject membership applications",

  // Payment Management
  [Privilege.PAYMENT_ADD_LINK]: "Add payment link for members",
  [Privilege.PAYMENT_UPDATE_STATUS]: "Update payment status",
  [Privilege.PAYMENT_READ]: "View payment information",

  // Events Management
  [Privilege.EVENTS_CREATE]: "Create events",
  [Privilege.EVENTS_READ]: "View events",
  [Privilege.EVENTS_UPDATE]: "Update events",
  [Privilege.EVENTS_DELETE]: "Delete events",

  // Documents Management
  [Privilege.DOCUMENTS_CREATE]: "Upload documents",
  [Privilege.DOCUMENTS_READ]: "View documents",
  [Privilege.DOCUMENTS_UPDATE]: "Update documents",
  [Privilege.DOCUMENTS_DELETE]: "Delete documents",

  // Master Data
  [Privilege.MASTERDATA_READ]: "View master data",
  [Privilege.MASTERDATA_UPDATE]: "Update master data",

  // System Administration
  [Privilege.SYSTEM_ADMIN]: "Full system administration access",
};

/**
 * Role Schema
 * Fully dynamic role management - no hardcoded enums
 * Roles are managed through the database and admin API
 * Denormalized design: privileges are embedded in roles
 * This reduces joins and improves query performance in MongoDB
 */
@Schema({ timestamps: true, collection: "roles" })
export class Role {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  name!: string; // Role code (e.g., "ADMIN", "FINANCE")

  @Prop({ type: String, required: true })
  displayName!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [String], required: true, enum: Object.values(Privilege) })
  privileges!: Privilege[];

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 0 })
  priority!: number; // Higher priority roles override lower ones

  // Metadata for auditing
  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);

// Create indexes for performance
RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ isActive: 1 });

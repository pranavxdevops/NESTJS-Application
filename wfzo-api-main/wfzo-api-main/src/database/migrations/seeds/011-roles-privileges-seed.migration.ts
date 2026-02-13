import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { Migration } from "../migration.interface";
import { Privilege } from "@modules/admin/schemas/role.schema";

/**
 * Migration: Seed Initial Roles and Privileges
 * 
 * This migration creates the initial role structure following MongoDB best practices:
 * - Denormalized design: privileges embedded in roles (no joins needed)
 * - All roles and privileges in one collection for efficient querying
 * - Idempotent: safe to run multiple times
 * - Flexible: New roles can be added via API without code changes
 */
@Injectable()
export class RolesPrivilegesSeedMigration implements Migration {
  name = "011-roles-privileges-seed";

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    const rolesCollection = this.connection.collection("roles");

    // Define initial roles with their privileges
    // Note: After initial seed, roles should be managed via the admin API
    const roles = [
      {
        name: "ADMIN",
        displayName: "Administrator",
        description: "Full system access - can manage all users, members, and system settings",
        priority: 100,
        isActive: true,
        privileges: [
          // User Management - Full CRUD
          Privilege.USERS_CREATE,
          Privilege.USERS_READ,
          Privilege.USERS_UPDATE,
          Privilege.USERS_DELETE,

          // Member Management - Full CRUD + Approval
          Privilege.MEMBERS_CREATE,
          Privilege.MEMBERS_READ,
          Privilege.MEMBERS_UPDATE,
          Privilege.MEMBERS_DELETE,
          Privilege.MEMBERS_APPROVE,
          Privilege.MEMBERS_REJECT,

          // Payment Management
          Privilege.PAYMENT_ADD_LINK,
          Privilege.PAYMENT_UPDATE_STATUS,
          Privilege.PAYMENT_READ,

          // Events Management
          Privilege.EVENTS_CREATE,
          Privilege.EVENTS_READ,
          Privilege.EVENTS_UPDATE,
          Privilege.EVENTS_DELETE,

          // Documents Management
          Privilege.DOCUMENTS_CREATE,
          Privilege.DOCUMENTS_READ,
          Privilege.DOCUMENTS_UPDATE,
          Privilege.DOCUMENTS_DELETE,

          // Master Data
          Privilege.MASTERDATA_READ,
          Privilege.MASTERDATA_UPDATE,

          // System Admin
          Privilege.SYSTEM_ADMIN,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "MEMBERSHIP_COMMITTEE",
        displayName: "Membership Committee",
        description: "Can view member details and approve/reject membership applications",
        priority: 50,
        isActive: true,
        privileges: [
          // Member Management - Read + Approval
          Privilege.MEMBERS_READ,
          Privilege.MEMBERS_APPROVE,
          Privilege.MEMBERS_REJECT,

          // Payment - Read only
          Privilege.PAYMENT_READ,

          // Documents - Read only
          Privilege.DOCUMENTS_READ,

          // Master Data - Read only
          Privilege.MASTERDATA_READ,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "MEMBERSHIP_BOARD",
        displayName: "Membership Board",
        description: "Board members who can view and approve membership applications",
        priority: 60,
        isActive: true,
        privileges: [
          // Member Management - Read + Approval
          Privilege.MEMBERS_READ,
          Privilege.MEMBERS_APPROVE,
          Privilege.MEMBERS_REJECT,

          // Payment - Read only
          Privilege.PAYMENT_READ,

          // Documents - Read only
          Privilege.DOCUMENTS_READ,

          // Master Data - Read only
          Privilege.MASTERDATA_READ,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "CEO",
        displayName: "Chief Executive Officer",
        description: "Executive access to view and approve membership applications",
        priority: 80,
        isActive: true,
        privileges: [
          // Member Management - Read + Approval
          Privilege.MEMBERS_READ,
          Privilege.MEMBERS_APPROVE,
          Privilege.MEMBERS_REJECT,

          // Payment - Read only
          Privilege.PAYMENT_READ,

          // Events - Read
          Privilege.EVENTS_READ,

          // Documents - Read only
          Privilege.DOCUMENTS_READ,

          // Master Data - Read only
          Privilege.MASTERDATA_READ,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "FINANCE",
        displayName: "Finance Team",
        description: "Can manage payment links and update payment status for members",
        priority: 40,
        isActive: true,
        privileges: [
          // Member Management - Read only
          Privilege.MEMBERS_READ,

          // Payment Management - Full access
          Privilege.PAYMENT_ADD_LINK,
          Privilege.PAYMENT_UPDATE_STATUS,
          Privilege.PAYMENT_READ,

          // Master Data - Read only
          Privilege.MASTERDATA_READ,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Upsert all roles (insert if not exists, update if exists)
    for (const role of roles) {
      await rolesCollection.updateOne(
        { name: role.name },
        {
          $set: role,
        },
        { upsert: true },
      );
    }

    console.log(`✅ [Migration ${this.name}] Seeded ${roles.length} roles with privileges`);
  }

  async down(): Promise<void> {
    const rolesCollection = this.connection.collection("roles");

    // Remove all seeded roles (you can customize this list)
    const initialRoleNames = ["ADMIN", "MEMBERSHIP_COMMITTEE", "MEMBERSHIP_BOARD", "CEO", "FINANCE"];
    const result = await rolesCollection.deleteMany({
      name: { $in: initialRoleNames },
    });

    console.log(`✅ [Migration ${this.name}] Removed ${result.deletedCount} roles`);
  }
}

import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { Migration } from "../migration.interface";

/**
 * Migration: Update roles and privileges to remove board approval stage
 *
 * This migration removes the MEMBERSHIP_BOARD role since board approval
 * is no longer part of the workflow.
 */
@Injectable()
export class UpdateRolesPrivilegesMigration implements Migration {
  name = "026-update-roles-privileges";

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    const rolesCollection = this.connection.collection("roles");

    // Remove the MEMBERSHIP_BOARD role
    const result = await rolesCollection.deleteOne({ name: "MEMBERSHIP_BOARD" });

    console.log(`✅ [Migration ${this.name}] Removed MEMBERSHIP_BOARD role (${result.deletedCount} document(s) deleted)`);
  }

  async down(): Promise<void> {
    const rolesCollection = this.connection.collection("roles");

    // Re-add the MEMBERSHIP_BOARD role
    const boardRole = {
      name: "MEMBERSHIP_BOARD",
      displayName: "Membership Board",
      description: "Board members who can view and approve membership applications",
      priority: 60,
      isActive: true,
      privileges: [
        // Member Management - Read + Approval
        "MEMBERS_READ",
        "MEMBERS_APPROVE",
        "MEMBERS_REJECT",

        // Payment - Read only
        "PAYMENT_READ",

        // Documents - Read only
        "DOCUMENTS_READ",

        // Master Data - Read only
        "MASTERDATA_READ",
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await rolesCollection.insertOne(boardRole);

    console.log(`✅ [Migration ${this.name}] Re-added MEMBERSHIP_BOARD role`);
  }
}
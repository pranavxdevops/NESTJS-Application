import { Migration } from "./migration.interface";
import { Model } from "mongoose";
import { Member } from "../../modules/member/schemas/member.schema";
import { Event } from "../../modules/events/schemas/event.schema";
import { User } from "../../modules/user/schemas/user.schema";
import { Document } from "../../modules/document/schemas/document.schema";
import { Membership } from "../../modules/membership/schemas/membership.schema";

/**
 * Consolidated migration to create all database indexes
 * Combines former migrations 001-005 for cleaner migration structure
 */
export class DatabaseIndexesMigration implements Migration {
  name = "001-database-indexes";

  constructor(
    private readonly memberModel: Model<Member>,
    private readonly eventModel: Model<Event>,
    private readonly userModel: Model<User>,
    private readonly documentModel: Model<Document>,
    private readonly membershipModel: Model<Membership>,
  ) {}

  async up(): Promise<void> {
    console.log("Creating database indexes...");

    // Member indexes
    try {
      // Drop conflicting index if it exists
      await this.memberModel.collection.dropIndex("memberId_1");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Index doesn't exist, continue
    }

    await this.memberModel.collection.createIndex(
      { memberId: 1 },
      { unique: true, name: "idx_member_id" },
    );
    await this.memberModel.collection.createIndex({ category: 1 }, { name: "idx_member_category" });
    await this.memberModel.collection.createIndex({ status: 1 }, { name: "idx_member_status" });
    await this.memberModel.collection.createIndex(
      { "companyInformation.companyName": 1 },
      { name: "idx_company_name" },
    );
    await this.memberModel.collection.createIndex(
      { createdAt: -1 },
      { name: "idx_member_created" },
    );

    // Event indexes
    await this.eventModel.collection.createIndex(
      { eventCode: 1 },
      { unique: true, name: "idx_event_code" },
    );
    await this.eventModel.collection.createIndex(
      { startDate: 1 },
      { name: "idx_event_start_date" },
    );
    await this.eventModel.collection.createIndex({ status: 1 }, { name: "idx_event_status" });

    // User indexes
    await this.userModel.collection.createIndex(
      { email: 1 },
      { unique: true, name: "idx_user_email" },
    );
    await this.userModel.collection.createIndex(
      { username: 1 },
      { unique: true, name: "idx_user_username" },
    );
    await this.userModel.collection.createIndex({ roles: 1 }, { name: "idx_user_roles" });

    // Document indexes
    await this.documentModel.collection.createIndex(
      { documentType: 1 },
      { name: "idx_document_type" },
    );
    await this.documentModel.collection.createIndex(
      { uploadedAt: -1 },
      { name: "idx_document_uploaded" },
    );

    // Membership indexes
    await this.membershipModel.collection.createIndex(
      { memberCode: 1 },
      { name: "idx_membership_member" },
    );
    await this.membershipModel.collection.createIndex(
      { status: 1 },
      { name: "idx_membership_status" },
    );
    await this.membershipModel.collection.createIndex(
      { validFrom: 1, validTo: 1 },
      { name: "idx_membership_validity" },
    );

    console.log("Database indexes created successfully");
  }

  async down(): Promise<void> {
    console.log("Dropping database indexes...");

    // Drop all custom indexes (keep only _id index)
    const collections = [
      this.memberModel.collection,
      this.eventModel.collection,
      this.userModel.collection,
      this.documentModel.collection,
      this.membershipModel.collection,
    ];

    for (const collection of collections) {
      const indexes = await collection.indexes();
      for (const index of indexes) {
        // Only drop custom indexes, not the _id index
        if (index.name && index.name !== "_id_") {
          await collection.dropIndex(index.name);
        }
      }
    }

    console.log("Database indexes dropped successfully");
  }
}

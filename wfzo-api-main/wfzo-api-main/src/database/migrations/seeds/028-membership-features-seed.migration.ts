import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { Migration } from "../migration.interface";

/**
 * Migration: Seed Membership Features
 * 
 * This migration populates the membership features collection with entitlements
 * for different membership types: guest, votingMember, and associateMember.
 * 
 * Features include access levels for:
 * - Events (seats)
 * - Library (downloads, member news)
 * - Network
 * - Knowledge Atlas
 * 
 * Endpoint: /membership/features/:type
 */
@Injectable()
export class MembershipFeaturesSeedMigration implements Migration {
  name = "028-membership-features-seed";

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    const membershipCollection = this.connection.collection("memberships");

    console.log("Seeding membership features...");

    const membershipFeatures = [
      // Guest Features
      {
        type: "guest",
        description: "Guest with restricted access",
        entitlements: {
          "events.seats": {
            access: "unlimited",
          },
          "library.downloads": {
            access: "unlimited",
          },
          "library.memberNews": {
            access: "restricted",
            authenticationRequired: true,
          },
          "knowledge.atlas": {
            access: "restricted",
            authenticationRequired: true,
          },
        },
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Voting Member Features
      {
        type: "votingMember",
        description: "Voting Member with full access",
        entitlements: {
          "events.seats": {
            access: "unlimited",
          },
          "library.downloads": {
            access: "unlimited",
          },
          "library.memberNews": {
            access: "unlimited",
            authenticationRequired: true,
          },
          "network": {
            access: "unlimited",
            authenticationRequired: true,
          },
          "knowledge.atlas": {
            access: "unlimited",
            authenticationRequired: true,
          },
        },
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Associate Member Features
      {
        type: "associateMember",
        description: "Associate Member with full access",
        entitlements: {
          "events.seats": {
            access: "unlimited",
          },
          "library.downloads": {
            access: "unlimited",
          },
          "library.memberNews": {
            access: "unlimited",
            authenticationRequired: true,
          },
          "network": {
            access: "unlimited",
            authenticationRequired: true,
          },
          "knowledge.atlas": {
            access: "unlimited",
            authenticationRequired: true,
          },
        },
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert membership features (upsert to handle re-runs)
    for (const feature of membershipFeatures) {
      await membershipCollection.updateOne(
        { type: feature.type },
        { $set: feature },
        { upsert: true }
      );
      console.log(`✓ Seeded membership features for: ${feature.type}`);
    }

    console.log("✓ Membership features seed completed");
  }

  async down(): Promise<void> {
    const membershipCollection = this.connection.collection("memberships");

    console.log("Rolling back membership features seed...");

    // Remove the seeded membership types
    await membershipCollection.deleteMany({
      type: { $in: ["guest", "votingMember", "associateMember"] },
    });

    console.log("✓ Membership features seed rollback completed");
  }
}

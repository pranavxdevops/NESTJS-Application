import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { Counter } from "../../../shared/schemas/counter.schema";

/**
 * Migration: Initialize member ID counter
 *
 * This migration initializes the counter for auto-generating member IDs.
 * Since this is a fresh database, it just creates the counter starting at 0.
 */
export class InitializeMemberCounterMigration implements Migration {
  name = "012-initialize-member-counter";

  constructor(private readonly counterModel: Model<Counter>) {}

  async up(): Promise<void> {
    console.log("Running migration: Initialize member ID counter");

    // Check if counter already exists
    const existingCounter = await this.counterModel.findOne({ name: "member" });

    if (existingCounter) {
      console.log(`Member counter already exists with sequence: ${existingCounter.seq}`);
      return;
    }

    // Create the member counter starting at 0
    await this.counterModel.create({
      name: "member",
      seq: 0,
    });

    console.log("Initialized member counter at sequence: 0");
    console.log("Next member will be: MEMBER-001");
  }

  async down(): Promise<void> {
    console.log("Rolling back migration: Remove member ID counter");

    // Remove the member counter
    await this.counterModel.deleteOne({ name: "member" });

    console.log("Removed member counter");
  }
}

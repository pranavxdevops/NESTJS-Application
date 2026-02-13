import { Migration } from "../migration.interface";
import { Model } from "mongoose";
import { Counter } from "../../../shared/schemas/counter.schema";

/**
 * Migration: Initialize application counter
 *
 * Creates counter for applicationNumber generation (APP-001, APP-002, etc.)
 */
export class InitializeApplicationCounterMigration implements Migration {
  name = "015-initialize-application-counter";

  constructor(private readonly counterModel: Model<Counter>) {}

  async up(): Promise<void> {
    console.log("Initializing application counter...");

    // Check if counter already exists
    const existingCounter = await this.counterModel.findOne({ name: "application" });

    if (!existingCounter) {
      await this.counterModel.create({
        name: "application",
        seq: 0,
      });
      console.log("✓ Application counter initialized with seq: 0");
    } else {
      console.log("✓ Application counter already exists");
    }
  }

  async down(): Promise<void> {
    console.log("Removing application counter...");
    await this.counterModel.deleteOne({ name: "application" });
    console.log("✓ Application counter removed");
  }
}

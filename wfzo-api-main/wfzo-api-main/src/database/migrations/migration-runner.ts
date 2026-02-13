import { Connection, Model, Schema } from "mongoose";
import { Logger } from "@nestjs/common";
import { Migration, MigrationRecord } from "./migration.interface";

/**
 * Migration schema for tracking executed migrations
 */
const migrationSchema = new Schema<MigrationRecord>({
  name: { type: String, required: true, unique: true },
  executedAt: { type: Date, required: true },
  executionTimeMs: { type: Number, required: true },
  status: { type: String, enum: ["completed", "failed", "rolled_back"], required: true },
  error: { type: String },
});

/**
 * Migration runner - executes and tracks database migrations
 */
export class MigrationRunner {
  private readonly logger = new Logger(MigrationRunner.name);
  private migrationModel: Model<MigrationRecord>;

  constructor(private readonly connection: Connection) {
    // Create or get the migrations collection model
    this.migrationModel =
      (this.connection.models.migrations as Model<MigrationRecord>) ||
      this.connection.model<MigrationRecord>("migrations", migrationSchema);
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    return this.migrationModel.find({ status: "completed" }).sort({ executedAt: 1 }).exec();
  }

  /**
   * Check if a migration has been executed
   */
  async hasBeenExecuted(migrationName: string): Promise<boolean> {
    const record = await this.migrationModel
      .findOne({ name: migrationName, status: "completed" })
      .exec();
    return !!record;
  }

  /**
   * Run pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    this.logger.log(`Checking ${migrations.length} migrations...`);

    for (const migration of migrations) {
      const executed = await this.hasBeenExecuted(migration.name);

      if (executed) {
        this.logger.debug(`Migration ${migration.name} already executed, skipping`);
        continue;
      }

      await this.executeMigration(migration);
    }

    this.logger.log("All migrations completed successfully");
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    this.logger.log(`Running migration: ${migration.name}`);
    const startTime = Date.now();

    try {
      // Execute the migration
      await migration.up();

      const executionTimeMs = Date.now() - startTime;

      // Record successful execution - use upsert to avoid duplicates
      await this.migrationModel.updateOne(
        { name: migration.name },
        {
          name: migration.name,
          executedAt: new Date(),
          executionTimeMs,
          status: "completed",
        },
        { upsert: true },
      );

      this.logger.log(`Migration ${migration.name} completed in ${executionTimeMs}ms`);
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record failed execution - use upsert to avoid duplicates
      await this.migrationModel.updateOne(
        { name: migration.name },
        {
          name: migration.name,
          executedAt: new Date(),
          executionTimeMs,
          status: "failed",
          error: errorMessage,
        },
        { upsert: true },
      );

      this.logger.error(`Migration ${migration.name} failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Rollback the last executed migration
   */
  async rollbackLastMigration(migrations: Migration[]): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      this.logger.warn("No migrations to rollback");
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migration = migrations.find((m) => m.name === lastMigration.name);

    if (!migration) {
      throw new Error(`Migration ${lastMigration.name} not found in migration list`);
    }

    this.logger.log(`Rolling back migration: ${migration.name}`);
    const startTime = Date.now();

    try {
      // Execute rollback
      await migration.down();

      const executionTimeMs = Date.now() - startTime;

      // Update the migration record
      await this.migrationModel.updateOne(
        { name: migration.name },
        {
          status: "rolled_back",
          executionTimeMs,
        },
      );

      this.logger.log(`Migration ${migration.name} rolled back in ${executionTimeMs}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Rollback of ${migration.name} failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get migration status report
   */
  async getStatus(): Promise<{
    total: number;
    completed: number;
    failed: number;
    rolledBack: number;
    migrations: MigrationRecord[];
  }> {
    const all = await this.migrationModel.find().sort({ executedAt: 1 }).exec();

    return {
      total: all.length,
      completed: all.filter((m) => m.status === "completed").length,
      failed: all.filter((m) => m.status === "failed").length,
      rolledBack: all.filter((m) => m.status === "rolled_back").length,
      migrations: all,
    };
  }
}

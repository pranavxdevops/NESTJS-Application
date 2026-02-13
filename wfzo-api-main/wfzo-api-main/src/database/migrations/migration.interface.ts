/**
 * Interface for database migrations
 * Each migration must implement up() and down() methods
 */
export interface Migration {
  /**
   * Unique identifier for the migration
   * Format: YYYYMMDDHHMMSS-description
   * Example: 20251023120000-create-indexes
   */
  name: string;

  /**
   * Execute the migration
   * This method should be idempotent (safe to run multiple times)
   */
  up(): Promise<void>;

  /**
   * Rollback the migration
   * This method should reverse the changes made in up()
   */
  down(): Promise<void>;
}

/**
 * Migration execution record stored in database
 */
export interface MigrationRecord {
  name: string;
  executedAt: Date;
  executionTimeMs: number;
  status: "completed" | "failed" | "rolled_back";
  error?: string;
}

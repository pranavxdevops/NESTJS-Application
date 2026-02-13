#!/usr/bin/env node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { MigrationService } from "./migration.service";

/**
 * Migration CLI - Run database migrations from command line
 *
 * Usage:
 *   npm run migrate              - Run pending migrations
 *   npm run migrate:rollback     - Rollback last migration
 *   npm run migrate:status       - Show migration status
 */
async function bootstrap() {
  const command = process.argv[2] || "up";

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const migrationService = app.get(MigrationService);

  try {
    switch (command) {
      case "up":
        console.log("\n🔄 Running pending migrations...\n");
        await migrationService.runPendingMigrations();
        console.log("\n✓ Migrations completed successfully\n");
        break;

      case "down":
      case "rollback":
        console.log("\n🔄 Rolling back last migration...\n");
        await migrationService.rollbackLastMigration();
        console.log("\n✓ Rollback completed successfully\n");
        break;

      case "status": {
        console.log("\n📊 Migration Status:\n");
        const status = await migrationService.getStatus();
        console.log(`Total migrations: ${status.total}`);
        console.log(`Completed: ${status.completed}`);
        console.log(`Failed: ${status.failed}`);
        console.log(`Rolled back: ${status.rolledBack}\n`);

        if (status.migrations.length > 0) {
          console.log("Migration history:");
          status.migrations.forEach((m: any) => {
            const statusIcon = m.status === "completed" ? "✓" : m.status === "failed" ? "✗" : "↺";
            console.log(
              `  ${statusIcon} ${m.name} (${m.status}) - ${new Date(m.executedAt).toLocaleString()}`,
            );
          });
          console.log();
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log("\nUsage:");
        console.log("  npm run migrate              - Run pending migrations");
        console.log("  npm run migrate:rollback     - Rollback last migration");
        console.log("  npm run migrate:status       - Show migration status\n");
        process.exit(1);
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    await app.close();
    process.exit(1);
  }
}

void bootstrap();

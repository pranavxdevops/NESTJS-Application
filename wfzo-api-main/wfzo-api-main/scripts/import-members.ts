import { connect, connection } from "mongoose";
import * as path from "path";
import { VotingMemberMigration } from "./migrations/voting-member-migration";
import { MembershipDatabase2025Migration } from "./migrations/membership-database-2025-migration";

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wfzo";

/**
 * Available migration templates
 */
const MIGRATION_TEMPLATES = {
  voting: {
    name: "WorldFZO Membership Application Form (Voting)",
    description: "Migrate from WorldFZO Membership Application Form template",
    class: VotingMemberMigration,
  },
  "2025-database": {
    name: "Membership Database 2025",
    description: "Migrate from existing 2025 membership database",
    class: MembershipDatabase2025Migration,
  },
} as const;

type MigrationTemplate = keyof typeof MIGRATION_TEMPLATES;

/**
 * Main migration runner
 */
async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error("❌ Error: Missing required arguments");
      printUsage();
      process.exit(1);
    }

    const [templateType, excelFilePath] = args;

    // Validate template type
    if (!(templateType in MIGRATION_TEMPLATES)) {
      console.error(`❌ Error: Unknown template type "${templateType}"`);
      printUsage();
      process.exit(1);
    }

    const template = MIGRATION_TEMPLATES[templateType as MigrationTemplate];
    const absolutePath = path.resolve(excelFilePath);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`🚀 WorldFZO Member Import Tool`);
    console.log(`${"=".repeat(80)}`);
    console.log(`\nTemplate: ${template.name}`);
    console.log(`Excel File: ${absolutePath}`);
    console.log(`Database: ${MONGODB_URI}\n`);

    // Connect to MongoDB
    console.log(`🔌 Connecting to MongoDB...`);
    await connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Create and initialize migration
    const migration = new template.class(absolutePath);
    await migration.initialize(connection);

    // Run migration
    await migration.migrate();

    // Close connection
    await connection.close();
    console.log("\n✅ Import completed successfully!");
    console.log(`${"=".repeat(80)}\n`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    if (connection.readyState === 1) {
      await connection.close();
    }
    process.exit(1);
  }
}

/**
 * Print usage instructions
 */
function printUsage() {
  console.log("\nUsage:");
  console.log("  pnpm run import:members <template-type> <path-to-excel-file>");
  console.log("\nAvailable Templates:");

  for (const [key, template] of Object.entries(MIGRATION_TEMPLATES)) {
    console.log(`  ${key.padEnd(20)} - ${template.description}`);
  }

  console.log("\nExamples:");
  console.log(
    "  pnpm run import:members voting WorldFZOMembershipApplicationFormVoting.xlsx",
  );
  console.log(
    "  pnpm run import:members 2025-database Membership_Database_2025.xlsx",
  );
  console.log("\nEnvironment Variables:");
  console.log("  MONGODB_URI - MongoDB connection string (default: mongodb://localhost:27017/wfzo)");
}

// Run the script
void main();

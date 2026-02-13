/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Collection } from "mongoose";

/**
 * Helper utilities for database migrations
 */

interface IndexOptions {
  unique?: boolean;
  sparse?: boolean;
  name: string;
  [key: string]: any;
}

/**
 * Check if an index exists by name
 */
export async function indexExists(collection: Collection, indexName: string): Promise<boolean> {
  try {
    const indexes = await collection.listIndexes().toArray();
    return indexes.some((idx: any) => idx.name === indexName);
  } catch {
    return false;
  }
}

/**
 * Create index only if it doesn't exist
 * Makes migrations idempotent
 */
export async function createIndexIfNotExists(
  collection: Collection,
  keys: any,
  options: IndexOptions,
): Promise<void> {
  const indexName = options.name;

  if (!indexName) {
    throw new Error("Index name is required for safe index creation");
  }

  const exists = await indexExists(collection, indexName);

  if (exists) {
    console.log(`  ⊙ Index ${indexName} already exists, skipping`);
    return;
  }

  try {
    await collection.createIndex(keys, options);
    console.log(`  ✓ Created index ${indexName}`);
  } catch (error: any) {
    // If index already exists with different name, log and continue
    if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
      console.log(`  ⊙ Index on fields already exists (different name), skipping ${indexName}`);
    } else {
      throw error;
    }
  }
}

/**
 * Drop index only if it exists
 * Makes rollbacks safe
 */
export async function dropIndexIfExists(collection: Collection, indexName: string): Promise<void> {
  const exists = await indexExists(collection, indexName);

  if (!exists) {
    console.log(`  ⊙ Index ${indexName} doesn't exist, skipping drop`);
    return;
  }

  try {
    await collection.dropIndex(indexName);
    console.log(`  ✓ Dropped index ${indexName}`);
  } catch (error: any) {
    // If index doesn't exist, that's fine
    if (error.code === 27 || error.codeName === "IndexNotFound") {
      console.log(`  ⊙ Index ${indexName} not found, skipping`);
    } else {
      throw error;
    }
  }
}

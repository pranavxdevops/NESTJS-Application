/**
 * Deep merge utility for preserving existing data during partial updates
 * Skips undefined and null values to avoid overwriting existing data
 */

/**
 * Creates MongoDB update object that deep-merges data instead of replacing it
 * Undefined/null values are skipped to preserve existing data
 *
 * @param dto - Partial data object with possibly undefined values
 * @returns Object formatted for MongoDB update with proper dot notation for nested fields
 *
 * @example
 * // Input: { organisationInfo: { companyName: undefined, address: { city: "NYC" } } }
 * // Output: { "organisationInfo.address.city": "NYC" }
 * // Result: Preserves organisationInfo.companyName while updating address.city
 */
export function createDeepMergeUpdate(dto: Record<string, unknown>): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  function flattenObject(obj: unknown, prefix = ""): void {
    if (obj === null || obj === undefined) {
      return;
    }

    const isObject = typeof obj === "object" && !(obj instanceof Date) && !Array.isArray(obj);

    if (!isObject) {
      // For arrays and primitives, set the value only if it's defined
      if (obj !== undefined && obj !== null) {
        update[prefix] = obj;
      }
      return;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === undefined || value === null) {
          // Skip undefined and null values - this preserves existing data
          continue;
        }

        const isNestedObject =
          typeof value === "object" && !(value instanceof Date) && !Array.isArray(value);

        if (isNestedObject) {
          // Recursively flatten nested objects
          flattenObject(value, newKey);
        } else {
          // Set primitive or array value
          update[newKey] = value;
        }
      }
    }
  }

  flattenObject(dto);

  return update;
}

/**
 * Alternative approach: Merge two objects recursively, with new data overriding existing only for defined values
 *
 * @param existing - Existing object in database
 * @param partial - Partial update object with possibly undefined values
 * @returns Merged object ready to replace the database record
 *
 * @example
 * const existing = { company: "Acme", website: "acme.com", industry: "Tech" };
 * const partial = { company: "Acme Inc", industry: undefined };
 * const result = deepMergeObjects(existing, partial);
 * // Result: { company: "Acme Inc", website: "acme.com", industry: "Tech" }
 */
export function deepMergeObjects(existing: unknown, partial: unknown): unknown {
  if (partial === undefined || partial === null) {
    return existing;
  }

  if (
    typeof existing !== "object" ||
    typeof partial !== "object" ||
    existing instanceof Date ||
    partial instanceof Date ||
    Array.isArray(existing) ||
    Array.isArray(partial)
  ) {
    return partial !== undefined ? partial : existing;
  }

  const result = { ...(existing as Record<string, unknown>) };

  for (const key in partial) {
    if (Object.prototype.hasOwnProperty.call(partial, key)) {
      const partialValue = (partial as Record<string, unknown>)[key];

      if (partialValue === undefined || partialValue === null) {
        // Skip undefined/null - preserve existing
        continue;
      }

      const isNestedObject =
        typeof partialValue === "object" &&
        !(partialValue instanceof Date) &&
        !Array.isArray(partialValue);

      if (isNestedObject) {
        // Recursively merge nested objects
        result[key] = deepMergeObjects(result[key] || {}, partialValue);
      } else {
        // Override with new value
        result[key] = partialValue;
      }
    }
  }

  return result;
}

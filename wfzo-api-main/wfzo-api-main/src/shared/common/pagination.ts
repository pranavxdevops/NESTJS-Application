export interface PageQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface PageData {
  total: number;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  page: PageData;
}

// Defaults and helpers for pagination used across modules
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

/**
 * Normalize a page query object into safe values with defaults and bounds.
 * - page defaults to 1 and must be >= 1
 * - pageSize defaults to 20, must be >= 1 and <= MAX_PAGE_SIZE
 */
export function normalizePageQuery(q?: PageQuery): { page: number; pageSize: number } {
  const rawPage = q?.page ?? DEFAULT_PAGE;
  const rawSize = q?.pageSize ?? DEFAULT_PAGE_SIZE;
  const page =
    typeof rawPage === "number" && Number.isFinite(rawPage)
      ? Math.max(1, Math.trunc(rawPage))
      : DEFAULT_PAGE;
  const pageSize =
    typeof rawSize === "number" && Number.isFinite(rawSize)
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(rawSize)))
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

// lib/utils/seo/getPageTypeFromUrl.ts

import { PAGE_TYPES, PageType } from "@/lib/constants/seoConstants";

/**
 * Infers SEO schema type from URL slug.
 *
 * "/" → "home"
 * "/events/upcoming-events/abc" → "event"
 * "/events/past-events/xyz" → "event"
 * "/news-publications/annual-meeting" → "article"
 * "/about" → "page"
 */
export function getPageTypeFromUrl(urlSlug: string): PageType {
  if (!urlSlug || urlSlug === '/' || urlSlug === '') {
    return PAGE_TYPES.HOME;
  }

  const lower = urlSlug.toLowerCase();

  if (lower.startsWith('/events') || lower.includes('/events/')) {
    return PAGE_TYPES.EVENT;
  }

  if (
    lower.startsWith('/news-publications') ||
    lower.includes('/news-publications/')
  ) {
    return PAGE_TYPES.ARTICLE;
  }

  return PAGE_TYPES.PAGE;
}

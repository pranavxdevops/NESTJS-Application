import { routing } from '../../i18n/routing';

/**
 * Extracts the current locale from a pathname.
 * 
 * @param pathname - The pathname (e.g., "/en/search" or "/fr/about-us")
 * @returns The locale string (e.g., "en" or "fr"), or the default locale if not found
 * 
 * @example
 * getCurrentLocale("/en/search") // returns "en"
 * getCurrentLocale("/fr/about-us") // returns "fr"
 * getCurrentLocale("/search") // returns "en" (default)
 */
export function getCurrentLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  // Check if first segment is a valid locale
  if (routing.locales.includes(firstSegment as any)) {
    return firstSegment;
  }
  return routing.defaultLocale;
}

/**
 * Normalizes a URL to include the locale prefix required by Next.js routing.
 * Since Next.js uses localePrefix: 'always', all internal routes must include locale.
 * 
 * External URLs (http/https/mailto/#) are returned as-is.
 * URLs that already have a locale prefix are returned unchanged.
 * URLs without a locale prefix have the current locale prepended.
 * 
 * @param url - The URL to normalize (e.g., "/about-us/contact-us" or "/en/about-us/contact-us")
 * @param currentLocale - The current locale (e.g., "en" or "fr")
 * @returns The normalized URL with locale prefix
 * 
 * @example
 * normalizeUrlWithLocale("/about-us/contact-us", "en") // returns "/en/about-us/contact-us"
 * normalizeUrlWithLocale("/en/about-us/contact-us", "en") // returns "/en/about-us/contact-us"
 * normalizeUrlWithLocale("https://example.com", "en") // returns "https://example.com"
 * normalizeUrlWithLocale("#section", "en") // returns "#section"
 */
export function normalizeUrlWithLocale(url: string, currentLocale: string): string {
  if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('#')) {
    // External URLs or anchors - return as-is
    return url;
  }
  
  // Remove leading slash if present for easier parsing
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  
  // Check if URL already starts with a locale
  const segments = cleanUrl.split('/');
  const firstSegment = segments[0];
  if (routing.locales.includes(firstSegment as any)) {
    // Already has locale prefix - return as-is with leading slash
    return `/${cleanUrl}`;
  }
  
  // Prepend current locale
  return `/${currentLocale}/${cleanUrl}`;
}




const FALLBACK = '/assets/fallback-image.jpg';

/**
* Handles ALL Strapi image URLs correctly:
* - local relative paths → adds base
* - already full CDN URLs → returns unchanged
*/
export function getStrapiMediaUrl(url?: string, fallback?: string): string {
  if (!url) return FALLBACK;

  // If it's already a full URL (http or https), return it as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative path → prepend the image base URL
  const base = process.env.NEXT_PUBLIC_STRAPI_IMAGE_BASE_URL;
  if (!base) {
    console.warn('NEXT_PUBLIC_STRAPI_IMAGE_BASE_URL is missing');
    return FALLBACK;
  }

  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  return `${cleanBase}${cleanPath}`;
}

/**
* For public/app assets (logos, icons, etc.)
*/
export function getAppPublicImages(path?: string , fallback?: string): string {
  if (!path) return FALLBACK;

  const base = process.env.NEXT_PUBLIC_APP_BASE_URL || '';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}
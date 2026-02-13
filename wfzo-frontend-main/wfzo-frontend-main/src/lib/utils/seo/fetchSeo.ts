// lib/utils/seo/seo.ts
import { generateSeo } from './generateSeo';

export async function getPageSeo(urlSlug: string, locale: string) {
  const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  if (!STRAPI_BASE) throw new Error('Missing NEXT_PUBLIC_STRAPI_API_BASE_URL');

  // Normalize slug
  const isHome = urlSlug === '/';
  const apiSlug = isHome ? 'home' : urlSlug.replace(/^\/+/, '');

  // 🧠 Choose correct endpoint based on slug
  const endpoint = isHome
    ? `/api/home?locale=${locale}&populate[seo][populate]=*`
    : `/api/pages?filters[slug][$eq]=${apiSlug}&locale=${locale}&fields[0]=fullPath&populate[seo][populate]=*`;

  const res = await fetch(`${STRAPI_BASE}${endpoint}`, {
    next: { revalidate: 21600, tags: [`/api/${apiSlug}`] },
  });

  if (!res.ok) throw new Error(`Failed to fetch SEO data for slug: ${apiSlug}`);

  const data = await res.json();
  const pageData = isHome ? data?.data : data?.data?.[0];
  // 🧩 Extract SEO node
  const seo = pageData?.seo;
  const fullPath = pageData?.fullPath || ''; 

  return generateSeo(seo, locale, urlSlug, fullPath);
}

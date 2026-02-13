import { getPageTypeFromUrl } from "./getPageTypeFromUrl";
import { PAGE_TYPES } from "@/lib/constants/seoConstants";

// lib/utils/seo/generateSeo.ts
type SeoData = {
  metaTitle?: string;
  metaDescription?: string;
  metaRobots?: 'index,follow' | 'noindex,nofollow' | 'noindex,follow' | 'index,nofollow';
  metaImage?: { url?: string };
};

export function generateSeo(seo: SeoData, locale: string, urlSlug: string, fullPath?: string, startDateTime?: string
) {
  const SITE_NAME = 'World Free Zones Organization';
  const title = seo?.metaTitle ? seo.metaTitle : SITE_NAME;
  const description = seo?.metaDescription || 'World Free Zones Organization Website';

  const imageUrl = seo?.metaImage?.url
    ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${seo.metaImage.url}`
    : undefined;
    const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
  

  // Homepage canonical / OpenGraph URL should be just /
  // const path = urlSlug === '/' ? '' : urlSlug.replace(/^\/+/, '');
  const canonicalUrl = `${BASE_URL}${locale}${fullPath ? `${fullPath}` : ''}`;
  const type = getPageTypeFromUrl(urlSlug);
  const jsonLd: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
    },
  ];

  // 🏠 Add site-level schemas only on homepage
  if (type === PAGE_TYPES.HOME) {
    jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}wfzologo.png`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: BASE_URL,
        name: SITE_NAME,
      }
    );
  }

  // 📰 Add article schema if page type is article
  if (type === PAGE_TYPES.ARTICLE) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      image: imageUrl ? [imageUrl] : [],
      datePublished: new Date().toISOString(),
      author: { '@type': 'Organization', name: SITE_NAME },
    });
  }

  // 🎟️ Add event schema if needed
  if (type === PAGE_TYPES.EVENT) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: title,
      description,
      startDate: startDateTime || new Date().toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      organizer: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
      },
    });
  }

  return {
    title,
    description: description || 'World Free Zones Organization Website',
    robots: seo?.metaRobots || 'index, follow',
    openGraph: {
      title,
      description: description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}${locale}${fullPath ? `${fullPath}` : ''}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${process.env.NEXT_PUBLIC_APP_BASE_URL}en${fullPath ? `${fullPath}` : ''}`,
        ar: `${process.env.NEXT_PUBLIC_APP_BASE_URL}ar${fullPath ? `${fullPath}` : ''}`,
        es: `${process.env.NEXT_PUBLIC_APP_BASE_URL}es${fullPath ? `${fullPath}` : ''}`,
        zh: `${process.env.NEXT_PUBLIC_APP_BASE_URL}zh${fullPath ? `${fullPath}` : ''}`,
      },
    },
    jsonLd
  };
}
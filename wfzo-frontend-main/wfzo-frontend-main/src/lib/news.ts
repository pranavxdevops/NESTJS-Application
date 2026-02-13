import { cache } from 'react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';

type FeaturedItem = {
  id: number | string;
  title: string;
  slug?: string;
  minutesToRead: number | null;
  isLocked: boolean;
  source: string;
  publishedDate: string | null;
  shortDescription: string;
  categoryTitle: string | null;
  categorySlug: string | null;
  image: { url: string; alt: string; href: string | null };
  pdf?: { url: string; title: string | null; summary: string | null } | null;
  author?: {
    name: string;
    company?: string | null;
    image?: {
      id: number;
      image?: {
        id: number;
        url: string;
        formats?: {
          thumbnail?: {
            url: string;
          };
        };
      };
    };
  };
};

export const getTabs = cache(async () => {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }
  const res = await fetch(`${baseUrl}/api/tabs`, {
    next: {
      revalidate: 86400,
      tags: ['/api/tabs'],
    },
  });
  if (!res.ok) throw new Error('Failed to fetch tabs');
  const json = await res.json();
  return json.data || [];
});

export const getArticles = cache(async () => {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }
  const res = await fetch(`${baseUrl}/api/articles?populate=*`, {
    next: {
      revalidate: 86400,
      tags: ['/api/articles'],
    },
  });
  if (!res.ok) throw new Error('Failed to fetch articles');
  const json = await res.json();
  return json.data || [];
});

export const getFeaturedNews = cache(async () => {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }
  const res = await fetch(`${baseUrl}/api/articles?filters[isFeatured][$eq]=true&populate=*`, {
    next: {
      revalidate: 86400,
      tags: ['featured-news'],
    },
  });
  if (!res.ok) throw new Error('Failed to fetch featured news');
  const json = await res.json();
  return json.data || [];
});

export function formatFeaturedNews(
  featuredNews: any[]
): FeaturedItem[] {
  return featuredNews.map((item: any) => {
    
    const attributes = item.attributes ?? item;

    const imageUrl = attributes.newsImage?.url
      ? getStrapiMediaUrl(attributes.newsImage.url)
      : '';

    const title = attributes.title || 'Untitled Article';
    const slug = attributes.slug;

    const shortDescription = attributes.shortDescription || '';

    const publishedDate =
      attributes.publishedAt ||
      attributes.updatedAt ||
      null;

    const category = attributes.articleCategory ?? null;
    

    const articleFormat = attributes.articleFormat;
    const source = articleFormat === 'pdf' ? 'document' : 'article';

    const pdfUrl = attributes.pdfFile?.url
      ? getStrapiMediaUrl(attributes.pdfFile.url)
      : null;

    const authorName = attributes.authorName || '';
    const organizationName = attributes.organizationName || '';

    const authorImage = attributes.authorImage;
    const authorImageUrl = authorImage?.url;

    return {
      id: item.id,
      title,
      slug,
      minutesToRead: null,
      isLocked: false,
      source,
      publishedDate: publishedDate
        ? new Date(publishedDate).toISOString().split('T')[0]
        : null,
      shortDescription,
      categoryTitle: category,
      categorySlug: category?.slug ?? null,
      image: {
        url: imageUrl,
        alt: title,
        href: null,
      },
      pdf: pdfUrl
        ? {
            url: pdfUrl,
            title,
            summary: shortDescription,
          }
        : null,
      author: authorName
        ? {
            name: authorName,
            company: organizationName,
            image: authorImageUrl
              ? {
                  id: authorImage?.id ?? 0,
                  image: {
                    id: authorImage?.id ?? 0,
                    url: getStrapiMediaUrl(authorImageUrl),
                    formats: authorImage?.formats,
                  },
                }
              : undefined,
          }
        : undefined,
    };
  });
}

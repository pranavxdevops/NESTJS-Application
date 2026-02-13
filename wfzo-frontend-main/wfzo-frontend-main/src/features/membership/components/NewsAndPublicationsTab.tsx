'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { strapi } from '@/lib/strapi';
import GridSection from '@/features/about/components/GridSection';
import NewsCard from '@/shared/components/NewsCard';
import GoldButton from '@/shared/components/GoldButton';
import { CATEGORY_COLORS } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import EventCardSkeleton from '@/features/events/dashboard/component/EventCardSkeleton';

const ITEMS_PER_PAGE = 6;

interface ArticleCardData {
  id: number | string;
  documentId?: string;
  slug: string;
  title: string;
  shortDescription: string;
  articleCategory: string;
  organizationName: string;
  authorName: string;
  authorImage?: { url?: string };
  newsImage?: { url?: string };
  publishedAt?: string;
  updatedAt?: string;
  articleFormat?: 'write' | 'pdf';
  pdfFile?: { url?: string };
  newsStatus?: string;
  minutesToRead?: number;
}

export default function NewsAndPublicationsTab({organizationName}: {organizationName: string}) {
  // const { member } = useAuth();
  const [articles, setArticles] = useState<ArticleCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchPublishedArticles();
  }, [organizationName]);

  async function fetchPublishedArticles() {
    setIsLoading(true);
    // if (!member?.organisationInfo?.companyName) {
    //   setIsLoading(false);
    //   return;
    // }

    try {
      
      // Fetch articles by organization name
      const allArticles = await strapi.publicationApi.fetchYourArticles(organizationName);
 

      // // Filter only published articles
      // const publishedArticles = allArticles.filter(
      //   (article) =>
      //     (article.newsStatus || article.attributes?.newsStatus || '').toLowerCase() === 'published'
      // );

      setArticles(allArticles);
    } catch (error) {
      console.error('Error loading published articles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Transform articles for NewsCard component
  const transformedArticles = articles.slice(0, visibleCount).map((article) => {
    // Handle both direct and nested attributes structure from Strapi
    const attrs = (article as any).attributes ?? article;

    const categoryTitle = attrs.articleCategory || attrs.articleCategory || 'News';
    const categoryColor = CATEGORY_COLORS[categoryTitle] || {
      text: '#4D4D4D',
      background: '#EAEAEA',
    };

    // Author image
    const authorImageUrl = attrs.authorImage?.data?.attributes?.url
      ? getStrapiMediaUrl(attrs.authorImage.data.attributes.url)
      : attrs?.authorImage?.url
        ? getStrapiMediaUrl(attrs.authorImage.data.attributes.url)
        : null;

    // Article image
    const newsImageUrl = attrs.newsImage?.data?.attributes?.url || attrs?.newsImage?.url;
    const imageUrl = newsImageUrl
      ? getStrapiMediaUrl(newsImageUrl)
      : '/assets/placeholder-news.jpg';

    const publishedDate =
      attrs.publishedAt || attrs?.publishedAt || attrs.updatedAt || attrs?.updatedAt;

    const articleFormat = attrs.articleFormat || attrs?.articleFormat;
    const isPdf = articleFormat === 'pdf';

    const minutesToRead = attrs.minutesToRead || attrs?.minutesToRead;
    const readTime = minutesToRead
      ? `${minutesToRead} min read`
      : isPdf
        ? 'Downloadable PDF'
        : '3 min read';

    // PDF URL
    const pdfFileUrl = attrs.pdfFile?.data?.attributes?.url || attrs?.pdfFile?.url;
    const pdfUrl = pdfFileUrl ? getStrapiMediaUrl(pdfFileUrl) : undefined;

    const slug = attrs.slug || article.slug;
    const title = attrs.title || 'Untitled Article';
    const authorName = attrs.authorName || attrs?.authorName || 'Unknown Author';
    const organizationName = attrs.organizationName || attrs?.organizationName || '';
    const shortDescription = attrs.shortDescription || attrs?.shortDescription || '';
    const documentId = article.documentId || article.id;

    console.log('RAW ARTICLE:', articles[0]);

    return {
      id: documentId,
      title,
      category: categoryTitle,
      categoryColor,
      description: shortDescription,
      readTime,
      author: authorName,
      organization: organizationName,
      authorImg: authorImageUrl,
      image: imageUrl,
      type: isPdf ? 'document' : 'article',
      document: pdfUrl,
      publishedDate,
      isLocked: false,
      url: `/news-publications/${slug}`,
      openInNewTab: false,
      documentSection: isPdf
        ? {
            id: typeof documentId === 'number' ? documentId : 0,
            href: pdfUrl || '',
            downloadLabel: 'Download PDF',
            viewLabel: 'View',
          }
        : undefined,
    };
  });

  const hasMore = visibleCount < articles.length;

  if (isLoading) {
    return (
      <div>
{/* Intro Section Skeleton */}
      <div className="px-5 md:px-0 py-6">
        <div className="mb-6  space-y-3 max-w-[700px]">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>

{/* Upcoming Heading Skeleton */}
      <div className="mb-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-64 mb-6" />

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <EventCardSkeleton key={index} />
                ))}
              </div>
            </div></div>
    );
  }

  // Show message if no member data available
  // if (!member?.organisationInfo?.companyName) {
  //   return (
  //     <div className="bg-wfzo-gold-25 py-10">
  //       <div className="px-5 md:px-30">
  //         <p className="text-wfzo-grey-600 text-center">Unable to load articles.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-wfzo-gold-25">
      <div className="px-5 md:px-0 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <p className="text-wfzo-grey-700 font-source text-base leading-6 mb-4 max-w-[700px]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae purus sit
            amet risus lacinia varius in ut lorem. Cras efficitur dui non leo tincidunt, vitae
            posuere erat aliquam. Curabitur quis sodales libero, vel hendrerit eros.
          </p>
          <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-black leading-10">
            News & Publications
          </h2>
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="px-5 md:px-30 py-10">
          <p className="text-wfzo-grey-600 text-center font-source">No published articles available.</p>
        </div>
      ) : (
        <>
          <GridSection
            heading="News & Publications"
            members={transformedArticles}
            CardComponent={NewsCard}
            items={3}
            showHeading={false}
            className="!py-0 !pt-0 !px-3 md:!px-0"
          />

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <GoldButton onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}>
                Load more
              </GoldButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}

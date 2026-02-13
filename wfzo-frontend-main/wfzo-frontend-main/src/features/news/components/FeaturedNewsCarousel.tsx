"use client";

import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import NewsCard from '@/shared/components/NewsCard';
import { CATEGORY_COLORS } from '@/lib/constants/constants';
import { useState } from 'react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { useAuth } from '@/lib/auth/useAuth';


interface Author {
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
}

type FeaturedItem = {
  id: number | string;
  title: string;
  slug?:string;
  minutesToRead: number | null;
  isLocked: boolean;
  source: string;
  publishedDate: string | null;
  shortDescription: string;
  categoryTitle: string | null;
  categorySlug: string | null;
  image: { url: string; alt: string; href: string | null };
  pdf?: { url: string; title: string | null; summary: string | null } | null;
  author?: Author;
};
type FeaturedNewsCarouselProps = {
  items: FeaturedItem[];
  slideCount?: number;
  padding?: boolean;
};

export default function FeaturedNewsCarousel({ items, slideCount = 3, padding = false }: FeaturedNewsCarouselProps) {
  // Track hover/expanded card for desktop to show summary like elsewhere
  const [expandedCardId, setExpandedCardId] = useState<number | string | null>(null);
  const {member} = useAuth();
  if (!items || items.length === 0) return null;

  return (
    <AdvancedCarousel
      itemsCount={items.length}
      title={"Featured Publications"}
      description={undefined}
      containerClassName={padding ? 'px-5 md:px-30 py-10 md:py-20' : ''}
      pageHeading={false}
      visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: slideCount, xl: slideCount }}
      slidesToScroll={1}
      autoplay
      autoplayDelay={5000}
      loop
      showControls
      showProgressBar
      gap={12}
    >
      {items.map((card) => {
        const categoryTitle = card.categoryTitle || 'Featured';
        const categoryColor = CATEGORY_COLORS[categoryTitle] || {
          text: '#4D4D4D',
          background: '#EAEAEA',
        };
        return (
          <div key={card.id} className="h-full mb-6">
            <NewsCard
              id={card.id}
              title={card.title}
              category={categoryTitle}
              categoryColor={categoryColor}
              description={card.shortDescription}
              readTime={card.minutesToRead ? `${card.minutesToRead} min read` : card.source === 'document' ? 'Downloadable PDF' : '5 min read'}
              author= {card.author?.name || ''}
              organization={card.author?.company || ''}
              authorImg={
                card.author?.image?.image?.formats?.thumbnail?.url
                  ? getStrapiMediaUrl(card.author.image.image.formats.thumbnail.url)
                  : card.author?.image?.image?.url
                  ? getStrapiMediaUrl(card.author.image.image.url)
                  : null
              }
              image={card.image?.url || ''}
              document={card.pdf?.url}
              type={card.source}
              publishedDate={card.publishedDate ?? undefined}
              isLocked={card.isLocked}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              documentSection={card.pdf ? { id: typeof card.id === 'number' ? card.id : Number(card.id) || 0, href: card.pdf.url, downloadLabel: 'Download PDF', viewLabel: 'View' } : undefined}
              url={member 
              ? `/news-publications/all-publications/${card.slug}` 
              : `/news-publications/${card.slug}`}
            />
          </div>
        );
      })}
    </AdvancedCarousel>
  );
}

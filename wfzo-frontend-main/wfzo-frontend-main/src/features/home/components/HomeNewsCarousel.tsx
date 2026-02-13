'use client';
import React, { useState } from 'react';
import { Link } from 'i18n/navigation';
import LightButton from '@/shared/components/LightButton';
import LightPressButton from '@/shared/components/LightPressButton';
import NewsCard from '@/shared/components/NewsCard';
import AdvancedCarousal from '@/shared/components/AdvancedCarousal';
import { CATEGORY_COLORS } from '@/lib/constants/constants';

interface CardProps {
  id: string | number;
  title: string;
  slug: string;
  category: string;
  description: string;
  publishedDate: string;
  readTime: string;
  author: string;
  organization: string;
  authorImg: string | null;
  image: string;
  isLocked: boolean;
  type: string;
  source?: string;
  document?: string;
  documentSection?: {
    id: number;
    href: string;
    downloadLabel: string;
    viewLabel: string;
  };
}

interface TabData {
  id: number;
  title: string;
  cards: CardProps[];
}

interface HomeNewsCarouselProps {
  title: string;
  allTabs: TabData[];
}

export default function HomeNewsCarousel({ title, allTabs }: HomeNewsCarouselProps) {
  const [activeTabId, setActiveTabId] = useState<number>(allTabs[0]?.id || 0);
  const [expandedCardId, setExpandedCardId] = useState<number | string | null>(null);

  const activeTab = allTabs.find(tab => tab.id === activeTabId);
  const activeCards = activeTab?.cards || [];

  const exploreAllHash = activeTab?.title && activeTab.title !== "All" 
    ? activeTab.title.toLowerCase().replace(/\\s+/g, '-') 
    : "all";

  const getCardCategory = (card: CardProps) => {
    if (activeTab?.title === 'All') {
      return card.category;
    }
    return activeTab?.title || 'News';
  };

  return (
    <div className="mx-auto px-5 md:px-30">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6">
        <span>
          <h2 className="text-3xl font-montserrat font-black text-wfzo-grey-900">{title}</h2>
        </span>
        <Link
          href={`/news-publications?category=${exploreAllHash}` as any}
          className="text-wfzo-gold-600 font-source font-bold hover:text-wfzo-gold-700 whitespace-nowrap"
        >
          Explore all
        </Link>
      </div>
      {/* Tabs */}
      <div
        className="
          flex gap-2 overflow-x-auto scrollbar-hidden 
          md:gap-4 mb-4
        "
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {allTabs.map((tab) =>
          activeTabId === tab.id ? (
            <LightPressButton
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setExpandedCardId(null);
              }}
              baseClassName="rounded-[11px] px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base whitespace-nowrap flex-shrink-0"
            >
              {tab.title}
            </LightPressButton>
          ) : (
            <LightButton
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setExpandedCardId(null);
              }}
              className="
                font-source
                text-[#4D4D4D] rounded-[11px] px-2 py-1.5 
                hover:text-wfzo-gold-600
                hover:bg-wfzo-gold-100 hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] 
                transition-all duration-300 ease-in-out 
                text-sm md:text-base md:px-3 md:py-2 
                whitespace-nowrap flex-shrink-0
              "
            >
              {tab.title}
            </LightButton>
          )
        )}
      </div>
      {/* Carousel */}
      <AdvancedCarousal
        itemsCount={activeCards.length}
        title={undefined}
        description={undefined}
        pageHeading={false}
        visibleSlides={{
          xs: 1.2,
          sm: 2,
          md: 2,
          lg: 3,
          xl: 3,
        }}
        slidesToScroll={1}
        autoplay={false}
        autoplayDelay={5000}
        loop={activeCards.length > 3}
        showControls={true}
        showProgressBar={true}
        gap={16}
        containerClassName=''
      >
        {activeCards.map((item, idx) => {
          const category = getCardCategory(item);
          const categoryColor = CATEGORY_COLORS[category] || '#000';
          return (
            <div key={`${item.id}-${idx}`} className="h-full mb-6">
              <NewsCard 
                id={item.id}
                title={item.title}
                category={category}
                categoryColor={categoryColor}
                description={item.description}
                publishedDate={item.publishedDate}
                readTime={item.readTime}
                author={item.author}
                organization={item.organization}
                authorImg={item.authorImg}
                image={item.image}
                expandedCardId={expandedCardId}
                setExpandedCardId={setExpandedCardId}
                isLocked={item.isLocked}
                type={item.type}
                documentSection={item.documentSection}
                document={item.document}
                url={`/news-publications/${item.slug}`}
                openInNewTab={category === 'Newsletter'}
              />
            </div>
          );
        })}
      </AdvancedCarousal>
    </div>
  );
}
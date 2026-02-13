'use client';

import { useEffect, useMemo, useState } from 'react';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import { SearchInput } from '@/shared/components/SearchInput';
import SearchButton from '@/shared/components/SearchButton';
import LightPressButton from '@/shared/components/LightPressButton';
import Image from 'next/image';
import GridSection from '@/features/about/components/GridSection';
import NewsCard from '@/shared/components/NewsCard';
import GoldButton from '@/shared/components/GoldButton';
import { CATEGORY_COLORS } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { ArticleData } from '@/features/publications/dashboard/PublicationsDashboard';
import { useAuth } from '@/lib/auth/useAuth';

const DEFAULT_VISIBLE_COUNT = 9;
const LOAD_MORE_STEP = 9;

export type YourArticle = {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
  imageUrl: string;
  articleData: ArticleData;
  status: string;
  category: string;
  type: string;
  document?: string;
  slug?: string;
};

export type Tab = {
  id: number | string;
  documentId?: string | null;
  title: string;
  slug: string;
};

export type NewsCategoriesTabsProps = {
  articles: YourArticle[];
  tabs: Tab[];
  activeTab?: string;
  items?: number;
};

export default function NewsCategoriesTabs({ articles, tabs, activeTab, items = 2 }: NewsCategoriesTabsProps) {
  console.log("tabs", tabs);
  
  const articlesList = useMemo(() => articles ?? [], [articles]);
  const tabsList = useMemo(() => tabs ?? [], [tabs]);
  const tabBySlug = useMemo(() => {
    const map = new Map<string, Tab>();
    tabsList.forEach((tab) => {
      if (tab?.slug) {
        map.set(tab.slug, tab);
      }
    });
    return map;
  }, [tabsList]);

  const tabOptions = useMemo(() => {
    const options = tabsList
      .filter((tab) => tab?.title)
      .map((tab) => ({ label: tab.title, value: tab.title }));
    return [{ label: 'All', value: 'all' }, ...options];
  }, [tabsList]);

  const resolvedActiveTab = useMemo(() => {
    if (!activeTab) return 'all';
    const match = tabOptions.find((option) => option.value === activeTab);
    return match?.value ?? 'all';
  }, [activeTab, tabOptions]);

  const [selectedTab, setSelectedTab] = useState(resolvedActiveTab);
  const [searchValue, setSearchValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [expandedCardId, setExpandedCardId] = useState<number | string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const {member} = useAuth();

  useEffect(() => {
    setSelectedTab(resolvedActiveTab);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  }, [resolvedActiveTab]);

  const allCards = useMemo(() => articlesList, [articlesList]);

  const typeFilterOptions = useMemo(() => {
    const present = new Set<string>();
    allCards.forEach((card) => {
      if (card.type) present.add(card.type);
    });
    const options: { id: string; label: string; value: string }[] = [];
    if (present.has('article')) options.push({ id: 'article', label: 'Article', value: 'article' });
    if (present.has('document')) options.push({ id: 'document', label: 'PDF', value: 'document' });
    return options;
  }, [allCards]);

  const yearFilterOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    allCards.forEach((card) => {
      const y = card.date ? new Date(card.date).getFullYear() : null;
      if (y) yearsSet.add(String(y));
    });
    const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    return years.map((y) => ({ id: y, label: y, value: y }));
  }, [allCards]);

  const durationFilterOptions = useMemo(() => {
    return [
      { id: '3-5', label: '3-5 mins', value: '3-5' },
      { id: '6-9', label: '6-9 mins', value: '6-9' },
      { id: '10+', label: '10+ mins', value: '10+' },
    ];
  }, []);

  const handleActiveTabChange = (value: string) => {
    setSelectedTab(value);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const handleSearchClick = () => {
    handleSearchChange(inputValue);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputClear = () => {
    setInputValue('');
    setSearchValue('');
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const handleSourcesChange = (values: string[]) => {
    setSelectedSources(values);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const handleYearsChange = (id: string, selected: boolean) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const handleDurationsChange = (id: string, selected: boolean) => {
    setSelectedDurations((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExpandedCardId(null);
  };

  const activeLabel = useMemo(() => {
    if (selectedTab === 'all') return 'All';
    const match = tabOptions.find((option) => option.value === selectedTab);
    return match?.label ?? 'All';
  }, [selectedTab, tabOptions]);

  const cardsForActiveTab = useMemo(() => {
    if (selectedTab === 'all') return allCards;
    return allCards.filter(card => card.category === selectedTab);
  }, [selectedTab, allCards]);

  const filteredCards = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return cardsForActiveTab.filter((card) => {
      const matchesSearch = search
        ? card.title.toLowerCase().includes(search) || card.description.toLowerCase().includes(search)
        : true;
      const matchesSource = selectedSources.length
        ? selectedSources.includes(card.type || 'other')
        : true;
      const year = card.date ? String(new Date(card.date).getFullYear()) : null;
      const matchesYear = selectedYears.length
        ? year
          ? selectedYears.includes(year)
          : false
        : true;
      const matchesDuration = true;
      return matchesSearch && matchesSource && matchesYear && matchesDuration;
    });
  }, [cardsForActiveTab, searchValue, selectedSources, selectedYears, selectedDurations]);

  const visibleCards = filteredCards.slice(0, visibleCount);
  const hasMore = filteredCards.length > visibleCards.length;

  const membersForGrid = visibleCards.map((card) => {
    const categoryTitle = card.category || activeLabel;
    const categoryColor = CATEGORY_COLORS[categoryTitle] || {
      text: '#4D4D4D',
      background: '#EAEAEA',
    };

    return {
      id: card.id,
      title: card.title,
      category: categoryTitle,
      categoryColor,
      description: card.description,
      readTime: '5 min read',
      author: card.articleData?.authorName || '',
      organization: card.articleData?.organizationName || '',
      authorImg: card.articleData?.authorImage || '',
      image: card.imageUrl,
      document: card.articleData?.articleFormat === 'pdf' ? card.articleData?.pdfFile?.url : undefined,
      type: card.type,
      publishedDate: card.date,
      isLocked: false,
      expandedCardId,
      setExpandedCardId: (id: string | number | null) => setExpandedCardId(id),
      documentSection: card.type === 'document' ? {
        id: typeof card.id === 'number' ? card.id : Number(card.id) || 0,
        href: card.document || '',
        downloadLabel: 'Download PDF',
        viewLabel: 'View',
      } : undefined,
      url: member
          ? `/news-publications/all-publications/${card.slug}`
          : `/news-publications/${card.slug}`,
      openInNewTab: false,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="">
        <div className="flex flex-wrap items-start gap-3 md:gap-5">
          <div className="flex items-center gap-3">
            <SearchInput
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              onClear={handleInputClear}
              placeholder="Search"
            />
            <SearchButton onClick={handleSearchClick}>
              Search
            </SearchButton>
          </div>

          <div className="relative">
            <LightPressButton onClick={() => setIsFiltersOpen((v) => !v)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 18C10.7167 18 10.4792 17.9042 10.2875 17.7125C10.0958 17.5208 10 17.2833 10 17C10 16.7167 10.0958 16.4792 10.2875 16.2875C10.4792 16.0958 10.7167 16 11 16H13C13.2833 16 13.5208 16.0958 13.7125 16.2875C13.9042 16.4792 14 16.7167 14 17C14 17.2833 13.9042 17.5208 13.7125 17.7125C13.5208 17.9042 13.2833 18 13 18H11ZM7 13C6.71667 13 6.47917 12.9042 6.2875 12.7125C6.09583 12.5208 6 12.2833 6 12C6 11.7167 6.09583 11.4792 6.2875 11.2875C6.47917 11.0958 6.71667 11 7 11H17C17.2833 11 17.5208 11.0958 17.7125 11.2875C17.9042 11.4792 18 11.7167 18 12C18 12.2833 17.9042 12.5208 17.7125 12.7125C17.5208 12.9042 17.2833 13 17 13H7ZM4 8C3.71667 8 3.47917 7.90417 3.2875 7.7125C3.09583 7.52083 3 7.28333 3 7C3 6.71667 3.09583 6.47917 3.2875 6.2875C3.47917 6.09583 3.71667 6 4 6H20C20.2833 6 20.5208 6.09583 20.7125 6.2875C20.9042 6.47917 21 6.71667 21 7C21 7.28333 20.9042 7.52083 20.7125 7.7125C20.5208 7.90417 20.2833 8 20 8H4Z" fill="#8B6941"/>
              </svg>
              Filters
            </LightPressButton>

            {isFiltersOpen && (
              <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[65vh] md:max-h-[70vh] overflow-auto bg-white rounded-2xl shadow-wfzo z-50">
              
              {/* Year Section */}
              <div className="p-6 border-b border-[#DADADA] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-montserrat font-extrabold text-[#1C1C1C] leading-8">Year</h3>
                  <button
                      onClick={() => setSelectedYears([])}
                      disabled={selectedYears.length===0}
                      className={`px-4 py-2 text-base font-semibold font-source leading-6 rounded-sm 
                        ${selectedYears.length === 0 ? 'text-[#B7B7B7] cursor-not-allowed' : 'text-[#8B6941] hover:text-[#684F31] cursor-pointer' }`}
                >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {yearFilterOptions.map((opt) => {
                    const selected = selectedYears.includes(String(opt.id));
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleYearsChange(String(opt.id), !selected)}
                        className={`px-3 py-1 rounded-lg text-base font-normal font-source leading-6 border transition-all flex items-center gap-1 ${
                          selected
                            ? 'bg-white border-[#DADADA] text-[#1C1C1C]'
                            : 'bg-white border-[#DADADA] text-[#1C1C1C] hover:border-[#8B6941]'
                        }`}
                      >
                        {opt.label}
                        {selected && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54996 15.15L18.025 6.675C18.225 6.475 18.4583 6.375 18.725 6.375C18.9916 6.375 19.225 6.475 19.425 6.675C19.625 6.875 19.725 7.1125 19.725 7.3875C19.725 7.6625 19.625 7.9 19.425 8.1L10.25 17.3C10.05 17.5 9.81663 17.6 9.54996 17.6C9.2833 17.6 9.04996 17.5 8.84996 17.3L4.54996 13C4.34996 12.8 4.25413 12.5625 4.26246 12.2875C4.2708 12.0125 4.37496 11.775 4.57496 11.575C4.77496 11.375 5.01246 11.275 5.28746 11.275C5.56246 11.275 5.79996 11.375 5.99996 11.575L9.54996 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Section */}
              <div className="p-6 border-b border-[#DADADA] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-montserrat font-extrabold text-[#1C1C1C] leading-8">Type</h3>
                  <button
                      onClick={() => setSelectedSources([])}
                      disabled={selectedSources.length===0}
                      className={`px-4 py-2 text-base font-semibold font-source leading-6 rounded-sm 
                        ${selectedSources.length === 0 ? 'text-[#B7B7B7] cursor-not-allowed' : 'text-[#8B6941] hover:text-[#684F31] cursor-pointer' }`}
                >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {typeFilterOptions.map((opt) => {
                    const selected = selectedSources.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const next = selected
                            ? selectedSources.filter((v) => v !== opt.value)
                            : Array.from(new Set([...selectedSources, opt.value]));
                          handleSourcesChange(next);
                        }}
                        className={`px-3 py-1 rounded-lg text-base font-normal font-source leading-6 border transition-all flex items-center gap-1 ${
                          selected
                            ? 'bg-white border-[#DADADA] text-[#1C1C1C]'
                            : 'bg-white border-[#DADADA] text-[#1C1C1C] hover:border-[#8B6941]'
                        }`}
                      >
                        {opt.label}
                        {selected && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54996 15.15L18.025 6.675C18.225 6.475 18.4583 6.375 18.725 6.375C18.9916 6.375 19.225 6.475 19.425 6.675C19.625 6.875 19.725 7.1125 19.725 7.3875C19.725 7.6625 19.625 7.9 19.425 8.1L10.25 17.3C10.05 17.5 9.81663 17.6 9.54996 17.6C9.2833 17.6 9.04996 17.5 8.84996 17.3L4.54996 13C4.34996 12.8 4.25413 12.5625 4.26246 12.2875C4.2708 12.0125 4.37496 11.775 4.57496 11.575C4.77496 11.375 5.01246 11.275 5.28746 11.275C5.56246 11.275 5.79996 11.375 5.99996 11.575L9.54996 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Section */}
              <div className="p-6 border-b border-[#DADADA] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-montserrat font-extrabold text-[#1C1C1C] leading-8">Duration</h3>
                  <button
                      onClick={() => setSelectedDurations([])}
                      disabled={selectedDurations.length===0}
                      className={`px-4 py-2 text-base font-semibold font-source leading-6 rounded-sm 
                        ${selectedDurations.length === 0 ? 'text-[#B7B7B7] cursor-not-allowed' : 'text-[#8B6941] hover:text-[#684F31] cursor-pointer' }`}
                >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {durationFilterOptions.map((opt) => {
                    const selected = selectedDurations.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleDurationsChange(String(opt.id), !selected)}
                        className={`px-3 py-1 rounded-lg text-base font-normal font-source leading-6 border transition-all flex items-center gap-1 ${
                          selected
                            ? 'bg-white border-[#DADADA] text-[#1C1C1C]'
                            : 'bg-white border-[#DADADA] text-[#1C1C1C] hover:border-[#8B6941]'
                        }`}
                      >
                        {opt.label}
                        {selected && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54996 15.15L18.025 6.675C18.225 6.475 18.4583 6.375 18.725 6.375C18.9916 6.375 19.225 6.475 19.425 6.675C19.625 6.875 19.725 7.1125 19.725 7.3875C19.725 7.6625 19.625 7.9 19.425 8.1L10.25 17.3C10.05 17.5 9.81663 17.6 9.54996 17.6C9.2833 17.6 9.04996 17.5 8.84996 17.3L4.54996 13C4.34996 12.8 4.25413 12.5625 4.26246 12.2875C4.2708 12.0125 4.37496 11.775 4.57496 11.575C4.77496 11.375 5.01246 11.275 5.28746 11.275C5.56246 11.275 5.79996 11.375 5.99996 11.575L9.54996 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-[#F9F9F9] rounded-b-2xl border-t-2 border-[#DADADA]">
                <GoldButton
                  onClick={() => {
                    setIsFiltersOpen(false);
                  }}
                >
                  Apply filters
                </GoldButton>
              </div>
              </div>
            )}

            {isFiltersOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsFiltersOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="">
        <ScrollableTabs
          options={tabOptions}
          value={selectedTab}
          onValueChange={handleActiveTabChange}
        />
      </div>

      {visibleCards.length > 0 ? (
        <GridSection
          heading={activeLabel}
          members={membersForGrid}
          CardComponent={NewsCard}
          items={items}
          mobileMode="list"
          showHeading={false}
          className='!pt-0 !px-0'
        />
      ) : (
        <p className="text-wfzo-grey-700">No news items found.</p>
      )}

      {hasMore && (
        <div className="flex justify-center pb-10">
          <GoldButton onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}>
            Load More
          </GoldButton>
        </div>
      )}
    </div>
  );
}

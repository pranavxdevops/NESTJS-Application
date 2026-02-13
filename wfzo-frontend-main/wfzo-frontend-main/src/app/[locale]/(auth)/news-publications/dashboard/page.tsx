'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import SidebarSection from '@/features/events/dashboard/component/SidebarSection';
import GoldButton from '@/shared/components/GoldButton';
import { PlusIcon } from 'lucide-react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { STRAPI_URL, strapi } from '@/lib/strapi';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Link from "next/link";
import GoldButtonChevron from '@/shared/components/GoldButtonChevron';
import { useAuth } from '@/lib/auth/useAuth';
import PublicationsDashboard from '@/features/publications/dashboard/PublicationsDashboard';
import PublishArticleModal from '@/features/publications/dashboard/components/PublishArticleModal';
import ArticleListItem from '@/features/publications/dashboard/components/ArticleListItem';
import IncompleteProfileBanner from '@/features/profile/components/IncompleteProfileBanner';
import DraftSavedBanner from '@/features/events/dashboard/component/DraftSavedBanner';
import { ArticleData, ArticleStatus } from '@/features/publications/dashboard/PublicationsDashboard';
import { YourArticle, Tab } from '@/features/news/components/NewsCategoriesTabs';
import NewsCategoriesTabs from '@/features/news/components/NewsCategoriesTabs';
import FeaturedNewsCarousel from '@/features/news/components/FeaturedNewsCarousel';

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

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const router = useRouter();
  const { user, member } = useAuth();
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState(true);
  const [currentArticleData, setCurrentArticleData] = useState<ArticleData | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>('draft');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [allArticles, setAllArticles] = useState<YourArticle[]>([]);
  const [isTabsLoading, setIsTabsLoading] = useState(true);
  const [isAllArticlesLoading, setIsAllArticlesLoading] = useState(true);
  const [featuredNews, setFeaturedNews] = useState<FeaturedItem[]>([]);
  const [isFeaturedNewsLoading, setIsFeaturedNewsLoading] = useState(true);
  const [showDraftSavedBanner, setShowDraftSavedBanner] = useState(false);

  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=publications-dashboard
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats`;

  const handleOpenModal = () => {
    setCurrentStatus('draft');
    setCurrentArticleId(null);
    setCurrentArticleData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenArticleModal = (
    status: ArticleStatus,
    articleId?: string | number,
    articleData?: ArticleData | null
  ) => {
    setCurrentStatus(status);
    setCurrentArticleId(articleId || null);
    setCurrentArticleData(articleData || null);
    setIsModalOpen(true);
  };

  async function fetchArticles() {
    setIsArticlesLoading(true);
    if (!member?.organisationInfo?.companyName) {
      setIsArticlesLoading(false);
      return;
    }
    try {
      const orgName = member?.organisationInfo?.companyName;
      const data = await strapi.publicationApi.fetchYourArticles(orgName);
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    } finally {
      setIsArticlesLoading(false);
    }
  }

  async function fetchTabs() {
    setIsTabsLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/tabs`);
      if (!res.ok) throw new Error('Failed to fetch tabs');
      const json = await res.json();
      setTabs(json.data || []);
    } catch (error) {
      console.error('Error loading tabs:', error);
      setTabs([]);
    } finally {
      setIsTabsLoading(false);
    }
  }

  async function fetchAllArticles() {
    setIsAllArticlesLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/articles?populate=*`);
      if (!res.ok) throw new Error('Failed to fetch articles');
      const json = await res.json();
      // Transform to YourArticle
      const transformed: YourArticle[] = (json.data || []).map((item: any, index: number) => {
        const imageUrl = item.newsImage?.url ? getStrapiMediaUrl(item.newsImage.url) : '';
        const title = item.title || item.attributes?.title || 'Untitled Article';
        const organization = item.organizationName || item.attributes?.organizationName || '';
        const category = typeof item.articleCategory === 'object' ? item.articleCategory?.title : item.articleCategory || item.category?.title || '';
        const description = item.shortDescription || item.attributes?.shortDescription || '';
        const date = item.updatedAt || item.attributes?.updatedAt ? new Date(item.updatedAt || item.attributes?.updatedAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) : '';
        const status = (item.newsStatus || item.attributes?.newsStatus || 'draft').toLowerCase();
        const articleFormat = item.articleFormat || item.attributes?.articleFormat;
        const type = articleFormat === 'pdf' ? 'document' : 'article';
        const document = item.pdfFile?.url || item.attributes?.pdfFile?.url ? getStrapiMediaUrl(item.pdfFile?.url || item.attributes?.pdfFile?.url) : undefined;

        return {
          id: String(item.documentId || item.slug || item.id || `article-${index}`),
          title,
          organization,
          date,
          description,
          imageUrl,
          articleData: item, // The raw item as articleData
          status,
          category,
          type,
          document,
          slug: item.slug,
        };
      });
      setAllArticles(transformed);
    } catch (error) {
      console.error('Error loading all articles:', error);
      setAllArticles([]);
    } finally {
      setIsAllArticlesLoading(false);
    }
  }

  async function fetchFeaturedNews() {
    setIsFeaturedNewsLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/articles?filters[isFeatured][$eq]=true&populate=*`);
      if (!res.ok) throw new Error('Failed to fetch featured articles');
      const json = await res.json();
      // Transform to FeaturedItem
      const transformed: FeaturedItem[] = (json.data || []).map((item: any) => {
        const imageUrl = item.newsImage?.url ? getStrapiMediaUrl(item.newsImage.url) : '';
        const title = item.title || item.attributes?.title || 'Untitled Article';
        const slug = item.slug || item.attributes?.slug;
        const shortDescription = item.shortDescription || item.attributes?.shortDescription || '';
        const publishedDate = item.publishedAt || item.attributes?.publishedAt || item.updatedAt || item.attributes?.updatedAt;
        const categoryTitle = typeof item.articleCategory === 'object' ? item.articleCategory?.title : item.articleCategory || item.category?.title || null;
        const categorySlug = typeof item.articleCategory === 'object' ? item.articleCategory?.slug : null;
        const articleFormat = item.articleFormat || item.attributes?.articleFormat;
        const source = articleFormat === 'pdf' ? 'document' : 'article';
        const pdfUrl = item.pdfFile?.url || item.attributes?.pdfFile?.url ? getStrapiMediaUrl(item.pdfFile?.url || item.attributes?.pdfFile?.url) : null;
        const authorName = item.authorName || item.attributes?.authorName || '';
        const organizationName = item.organizationName || item.attributes?.organizationName || '';
        const authorImageUrl = item.authorImage || item.attributes?.authorImage?.url;

        return {
          id: item.id,
          title,
          slug,
          minutesToRead: null, // Not available
          isLocked: false, // Assume not locked
          source,
          publishedDate: publishedDate ? new Date(publishedDate).toISOString().split('T')[0] : null,
          shortDescription,
          categoryTitle,
          categorySlug,
          image: {
            url: imageUrl,
            alt: title,
            href: null,
          },
          pdf: pdfUrl ? {
            url: pdfUrl,
            title: title,
            summary: shortDescription,
          } : null,
          author: authorName ? {
            name: authorName,
            company: organizationName,
            image: authorImageUrl ? {
              id: item.authorImage?.id || item.attributes?.authorImage?.id || 0,
              image: {
                id: item.authorImage?.id || item.attributes?.authorImage?.id || 0,
                url: getStrapiMediaUrl(authorImageUrl),
                formats: item.authorImage?.formats || item.attributes?.authorImage?.formats,
              },
            } : undefined,
          } : undefined,
        };
      });
      setFeaturedNews(transformed);
    } catch (error) {
      console.error('Error loading featured news:', error);
      setFeaturedNews([]);
    } finally {
      setIsFeaturedNewsLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, [member, refreshTrigger]);

  useEffect(() => {
    fetchTabs();
    fetchAllArticles();
    fetchFeaturedNews();
  }, []);

  useEffect(() => {
    async function fetchPageHero() {
      try {
        const res = await fetch(pageUrl);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        const page = json.data?.[0];
        if (page) {
          const contents = page.contents || [];
          const heroSection = contents.find((c: { __component?: string }) => c.__component === 'sections.sections-hero');
          if (heroSection?.heroBanner?.image?.url) {
            setHeroImage(getStrapiMediaUrl(heroSection.heroBanner.image.url));
          } else if (heroSection?.heroBanner?.image?.formats?.large?.url) {
            setHeroImage(getStrapiMediaUrl(heroSection.heroBanner.image.formats.large.url));
          } else {
            setHeroImage(FALLBACK_IMAGE);
          }
        }
      } catch (error) {
        console.error('Error fetching page hero:', error);
        setHeroImage(FALLBACK_IMAGE);
      }
    }
    fetchPageHero();
  }, []);

  return (
    <div className="min-h-screen bg-wfzo-gold-25 relative">
      <HeroAuth backgroundImage={heroImage || FALLBACK_IMAGE} />
      <div className="px-5 md:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <IncompleteProfileBanner/>
            {showDraftSavedBanner && (
              <DraftSavedBanner
                message="Article has been saved as draft"
                onDismiss={() => setShowDraftSavedBanner(false)}
              />
            )}
            {/* Featured News Carousel */}
            {featuredNews.length > 0 && <FeaturedNewsCarousel items={featuredNews} slideCount={2} />}
            {/* Quick Actions */}
            <NewsCategoriesTabs articles={allArticles} tabs={tabs} />

            
          </div>

          {/* Sidebar - Right Column */}
           <div className="flex flex-col gap-6">
             {/* Create Article */}
             <SidebarSection
               onClick={handleOpenModal}
               className="cursor-pointer hover:bg-wfzo-gold-100 transition-colors"
             >
               <div className="flex flex-row items-center gap-3">
                 <div className="flex-shrink-0">
                   <GoldButtonChevron>
                     <PlusIcon className="w-6 h-6" />
                   </GoldButtonChevron>
                 </div>

                 <h3 className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                   Publish an Article
                 </h3>
               </div>
             </SidebarSection>

             {/* Articles You're Publishing */}
             {isArticlesLoading ? (
               <SidebarSection title="Articles You're Publishing (0)">
                 <div className="animate-pulse">
                   <div className="h-20 bg-wfzo-gold-100 rounded-lg"></div>
                 </div>
               </SidebarSection>
             ) : (
               <SidebarSection
                 title={`Articles You're Publishing (${articles.length})`}
                 action={
                   articles.length > 5 ? (
                     <Link href="/news-publications/your-publications">
                       <button className="font-source text-base cursor-pointer font-bold leading-5 text-wfzo-gold-600 mr-auto">View all</button>
                     </Link>
                   ) : undefined
                 }
               >
                 <div className="divide-y divide-wfzo-gold-200">
                   {articles.slice(0, 5).map((article, idx) => {
                     const status = ((article.newsStatus || article.attributes?.newsStatus || 'draft').toLowerCase()) as ArticleStatus;
                     const isActionable = status === 'draft' || status === 'pending' || status === 'rejected' || status === 'approved';

                     return (
                       <div key={idx} className='py-4'>
                         <ArticleListItem
                           article={article}
                           onClick={() => {
                             if (status === 'published' && article.articleFormat !== 'pdf') {
                               // For published articles, navigate to the published page
                               router.push(`/news-publications/all-publications/${article.slug}`);
                             } else {
                               // For draft, pending, rejected, approved, open modal
                               handleOpenArticleModal(status, article.id, article);
                             }
                           }}
                           onActionClick={
                             isActionable
                               ? () => handleOpenArticleModal(status, article.id, article)
                               : undefined
                           }
                         />
                       </div>
                     );
                   })}
                 </div>
               </SidebarSection>
             )}
           </div>
        </div>
      </div>

      <PublishArticleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        status={currentStatus}
        articleId={currentArticleId}
        articleData={currentArticleData}
        onSave={(status, operation) => {
          setRefreshTrigger((prev) => prev + 1);
          if (operation === 'save' && status === 'draft') {
            setShowDraftSavedBanner(true);
          }
        }}
      />
    </div>
  );
}

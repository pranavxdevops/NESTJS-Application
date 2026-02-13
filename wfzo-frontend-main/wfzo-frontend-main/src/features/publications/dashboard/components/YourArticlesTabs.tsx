'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArticleData, ArticleStatus } from '../PublicationsDashboard';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';
import NewsCard from '@/shared/components/NewsCard';
import { CATEGORY_COLORS, FALLBACK_IMAGE } from '@/lib/constants/constants';

type OnOpenModal = (status: ArticleStatus, articleId?: string, articleData?: ArticleData | null) => void;

export type YourArticle = {
  id: string;
  title: string;
  organization: string;
  date: string;
  description?: string;
  imageUrl?: string;
  articleData?: ArticleData | null;
  status: ArticleStatus;
  category?: string;
  type?: string;
  document?: string;
  slug?: string;
};

type YourArticlesTabsProps = {
  articles: YourArticle[];
  onOpenModal?: OnOpenModal;
};

const DEFAULT_VISIBLE_COUNT = 9;
const LOAD_MORE_STEP = 9;

export default function YourArticlesTabs({ articles, onOpenModal }: YourArticlesTabsProps) {
  const tabOptions = useMemo(() => [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
  ], []);

  const filteredtabOptions = useMemo(() => {
    return tabOptions.filter(tab =>
      articles.some(article => article.status === tab.value)
    );
  }, [tabOptions, articles]);

  const [activeTab, setActiveTab] = useState<string>('draft');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [expandedCardId, setExpandedCardId] = useState<string | number | null>(null);

  useEffect(() => {
    if (filteredtabOptions.length > 0 &&
      !filteredtabOptions.some(tab => tab.value === activeTab)
    ) {
      setActiveTab(filteredtabOptions[0].value);
    }
  }, [filteredtabOptions, activeTab]);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const articlesForActiveTab = useMemo(() => {
    return articles.filter(article => article.status === activeTab);
  }, [articles, activeTab]);

  const visibleArticles = useMemo(
    () => articlesForActiveTab.slice(0, Math.min(visibleCount, articlesForActiveTab.length)),
    [articlesForActiveTab, visibleCount]
  );


  console.log("visibleArticles", visibleArticles);
  
  const hasMore = articlesForActiveTab.length > visibleArticles.length;

  const handleEdit = (article: YourArticle) => {
    // Published articles redirect to the detail page
    if (article.status === 'published') {
      window.location.href = `/news-publications/all-publications/${article.slug}`;
    } else {
      // All other statuses (draft, pending, rejected, approved) open the modal
      onOpenModal?.(article.status, article.id, article.articleData);
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return CATEGORY_COLORS.default;
    return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
  };

  return (
    <div className="py-6 flex flex-col gap-6">
      <ScrollableTabs
        options={filteredtabOptions}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {articlesForActiveTab.length === 0 ? (
        <p className="text-wfzo-grey-700 py-10">
          No articles in this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleArticles.map((article) => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              category={article.category || 'General'}
              categoryColor={CATEGORY_COLORS[(article.category || 'General')] || '#000'}
              description={article.articleData?.shortDescription || ''}
              readTime="5 min read"
              author={article.articleData?.authorName || ''}
              authorImg = {article.articleData?.authorImage || ''}
              organization={article.articleData?.organizationName || ''}
              image={article.imageUrl || FALLBACK_IMAGE}
              type={article.type || 'article'}
              document={article.articleData?.articleFormat === 'pdf' ? article.articleData?.pdfFile?.url : undefined}
              documentSection={article.type === 'document' ? { id: typeof article.id === 'number' ? article.id : Number(article.id) || 0, href: article.document || '', downloadLabel: 'Download PDF', viewLabel: 'View' } : undefined}
              publishedDate={article.date}
              url={`/news-publications/all-publications/${article.id}`}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              onClick={() => handleEdit(article)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <GoldButton onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}>
            View More
          </GoldButton>
        </div>
      )}
    </div>
  );
}

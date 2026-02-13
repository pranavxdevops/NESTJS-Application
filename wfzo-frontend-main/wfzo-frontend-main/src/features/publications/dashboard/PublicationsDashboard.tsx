'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import GoldButton from '@/shared/components/GoldButton';
import PublishArticleModal from './components/PublishArticleModal';
import YourArticlesTabs, { YourArticle } from './components/YourArticlesTabs';
import { strapi } from '@/lib/strapi';
import { useAuth } from '@/lib/auth/useAuth';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';

export type ArticleStatus = 'draft' | 'pending' | 'rejected' | 'approved' | 'published';

export interface ArticleData {
  slug?: string;
  id?: string | number;
  documentId?: string | number;
  title?: string;
  authorName?: string;
  authorImage?: string;
  organizationName?: string;
  articleCategory?: string;
  articleFormat?: 'write' | 'pdf';
  shortDescription?: string;
  newsStatus?: ArticleStatus;
  publishedAt?: string;
  updatedAt?: string;
  comments?: string;
  pdfFile?: { url?: string };
  newsImage?: { url?: string };
  event_details?: Array<{
    id?: string | number;
    title?: string;
    content?: string;
    image?: { url?: string };
  }>;
  attributes?: any;
}

export default function PublicationsDashboard() {
  const router = useRouter();
  const { user, member } = useAuth();
  const [articles, setArticles] = useState<YourArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>('draft');
  const [currentArticleId, setCurrentArticleId] = useState<string | number | null>(null);
  const [currentArticleData, setCurrentArticleData] = useState<ArticleData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (member?.organisationInfo?.companyName) {
      fetchArticles();
    }
  }, [member, refreshTrigger]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const orgName = member?.organisationInfo?.companyName;
      const data = await strapi.publicationApi.fetchYourArticles(orgName);

      const normalized: YourArticle[] = (data || []).map((article: any, index: number) => {
        const imageUrl = article.newsImage?.url
          ? getStrapiMediaUrl(article.newsImage.url)
          : '';

        const title = article.title || article.attributes?.title || 'Untitled Article';
        const organization = article.organizationName || article.attributes?.organizationName || orgName || '';
        const category = article.articleCategory || article.attributes?.articleCategory || '';
        const description = article.shortDescription || article.attributes?.shortDescription || '';

        const date = article.updatedAt || article.attributes?.updatedAt
          ? new Date(article.updatedAt || article.attributes?.updatedAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '';

        let status = (article.newsStatus || article.attributes?.newsStatus || 'draft') as ArticleStatus;
        status = status.toLowerCase() as ArticleStatus;

        const articleFormat = article.articleFormat || article.attributes?.articleFormat;
        const type = articleFormat === 'pdf' ? 'document' : 'article';
        const document = article.pdfFile?.url || article.attributes?.pdfFile?.url ? getStrapiMediaUrl(article.pdfFile?.url || article.attributes?.pdfFile?.url) : undefined;

        return {
          id: String(article.documentId || article.slug || article.id || `article-${index}`),
          title,
          organization,
          date,
          description,
          imageUrl,
          articleData: article,
          status,
          category,
          type,
          document,
          slug: article.slug,
        } as YourArticle;
      });

      setArticles(normalized);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = () => {
    setCurrentArticleId(null);
    setCurrentArticleData(null);
    setCurrentStatus('draft');
    setIsModalOpen(true);
  };

  const handleOpenArticleModal = (
    status: ArticleStatus,
    articleId?: string | number,
    articleData?: ArticleData | null,
  ) => {
    setCurrentStatus(status);
    setCurrentArticleId(articleId || null);
    setCurrentArticleData(articleData || null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentArticleId(null);
    setCurrentArticleData(null);
  };

  const handleSave = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleModalClose();
  };

  return (
    <>
      {loading ? (
        <div className="text-center py-12">
          <p className="text-wfzo-grey-600">Loading articles...</p>
        </div>
      ) : (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
              Your Articles
            </h2>
            <GoldButton onClick={handleCreateArticle} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Create Article</span>
            </GoldButton>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-wfzo-gold-200 p-8 text-center">
              <p className="text-wfzo-grey-600 mb-4">No articles yet</p>
              <GoldButton onClick={handleCreateArticle}>
                Create Your First Article
              </GoldButton>
            </div>
          ) : (
            <YourArticlesTabs articles={articles} onOpenModal={handleOpenArticleModal} />
          )}
        </section>
      )}

      <PublishArticleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        status={currentStatus}
        articleId={currentArticleId}
        articleData={currentArticleData}
        onSave={handleSave}
      />
    </>
  );
}

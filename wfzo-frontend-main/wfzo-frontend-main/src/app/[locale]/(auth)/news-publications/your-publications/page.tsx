"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/shared/components/Breadcrumb";
import YourArticlesTabs, { YourArticle } from "@/features/publications/dashboard/components/YourArticlesTabs";
import { useEffect, useState } from "react";
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { strapi } from "@/lib/strapi";
import PublishArticleModal from '@/features/publications/dashboard/components/PublishArticleModal';
import { ArticleData, ArticleStatus } from '@/features/publications/dashboard/PublicationsDashboard';
import { useAuth } from "@/lib/auth/useAuth";
import HeroAuth from "@/features/events/dashboard/component/HeroAuth";
import GoldButton from "@/shared/components/GoldButton";
import Link from "next/link";

type ArticleStatusType = 'initial' | 'draft' | 'pending' | 'rejected' | 'approved' | 'published';

export default function YourPublicationsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<YourArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ArticleStatusType>('draft');
  const [currentArticleId, setCurrentArticleId] = useState<string | number | null>(null);
  const [currentArticleData, setCurrentArticleData] = useState<ArticleData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, member } = useAuth();

  useEffect(() => {
    if (!member?.organisationInfo?.companyName) return;
    async function fetchArticles() {
      try {
        const orgName = member?.organisationInfo?.companyName;
        const data = await strapi.publicationApi.fetchYourArticles(orgName);

        const normalized: YourArticle[] = data.map((article: any, index: number) => {
          const imageUrl = article.newsImage?.url
            ? getStrapiMediaUrl(article.newsImage.url)
            : '';

          const title = article.title || article.attributes?.title || 'Untitled Article';
          const organization = article.organizerName || article.attributes?.organizerName || '';
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
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [member, refreshTrigger]);

  const handleOpenArticleModal = (
    status: ArticleStatusType,
    articleId?: string | number,
    articleData?: ArticleData | null,
  ) => {
    setCurrentStatus(status);
    setCurrentArticleId(articleId || null);
    setCurrentArticleData(articleData || null);
    setIsModalOpen(true);
  };

  const handleCreateArticle = () => {
    setCurrentArticleId(null);
    setCurrentArticleData(null);
    setCurrentStatus('draft');
    setIsModalOpen(true);
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Publications", href: "/news-publications/dashboard", isHome: true },
    { label: "Your Publications", isCurrent: true }
  ];

  return (
    <>
      <div className="min-h-screen bg-wfzo-gold-25">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

        <div className="px-5 md:px-30 py-10">
          {/* Back Button */}
          <Link
          href="/news-publications/dashboard"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Page Title and Create Button */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
              Your Publications
            </h1>
            {/* <GoldButton onClick={handleCreateArticle} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Create Article</span>
            </GoldButton> */}
          </div>

          {/* Tabs and Articles */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-wfzo-grey-600 text-lg">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <p className="text-wfzo-grey-600 text-lg mb-4">No articles yet</p>
                <GoldButton onClick={handleCreateArticle}>
                  Create Your First Article
                </GoldButton>
              </div>
            </div>
          ) : (
            <YourArticlesTabs articles={articles} onOpenModal={handleOpenArticleModal} />
          )}
        </div>
      </div>

      <PublishArticleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentArticleId(null);
          setCurrentArticleData(null);
        }}
        status={currentStatus as ArticleStatus}
        articleId={currentArticleId}
        articleData={currentArticleData}
        onSave={() => {
          setRefreshTrigger((prev) => prev + 1);
          setIsModalOpen(false);
          setCurrentArticleId(null);
          setCurrentArticleData(null);
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { newsPublicationApi } from "@/lib/api/newsPublicationApi";
import { Article } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ApproveButton from "../components/ApproveButton";
import RejectButton from "../components/RejectButton";


export default function ArticleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const data = await newsPublicationApi.fetchArticleBySlug(slug);
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch article");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug, fetchArticle]);

  const handleApprove = () => {
    // Refresh the article data after approval
    fetchArticle();
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !article) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/news-publication")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to News Publications
            </button>
            <h2 className="text-3xl font-bold text-primary">Article Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Article not found"}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push("/news-publication")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to News Publications
          </button>
          <h2 className="text-3xl font-bold text-primary">{article.title}</h2>
          <p className="text-gray-600 mt-1">Article Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Title</label>
              <p className="mt-1 text-gray-900">{article.title}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Slug</label>
              <p className="mt-1 text-gray-900">{article.slug}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Author Name</label>
              <p className="mt-1 text-gray-900">{article.authorName}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Author Email</label>
              <p className="mt-1 text-gray-900">{article.authorEmail}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Article Category</label>
              <p className="mt-1 text-gray-900">{article.articleCategory}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Article Format</label>
              <p className="mt-1 text-gray-900">{article.articleFormat}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Name</label>
              <p className="mt-1 text-gray-900">{article.organizationName}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Locale</label>
              <p className="mt-1 text-gray-900">{article.locale}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Status</label>
              <p className="mt-1 text-gray-900">{article.newsStatus}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Is Featured</label>
              <p className="mt-1 text-gray-900">{article.isFeatured ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(article.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Updated At</label>
              <p className="mt-1 text-gray-900">
                {new Date(article.updatedAt).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Published At</label>
              <p className="mt-1 text-gray-900">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "Not published"}
              </p>
            </div>
          </div>

          {article.shortDescription && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Short Description</label>
              <p className="mt-1 text-gray-900">{article.shortDescription}</p>
            </div>
          )}

          {article.comments && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Rejected Reason</label>
              <p className="mt-1 text-gray-900">{article.comments}</p>
            </div>
          )}

          {/* Author Image */}
          {article.authorImage && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Author Image</label>
              <div className="mt-1">
                <img
                  src={article.authorImage}
                  alt={`${article.authorName} profile`}
                  className="w-16 h-16 rounded-full object-cover shadow-sm"
                />
              </div>
            </div>
          )}

          {/* News Image */}
          {article.newsImage && article.newsImage.url && (
            <div>
              <label className="text-sm font-semibold text-gray-600">News Image</label>
              <div className="mt-1">
                <img
                  src={article.newsImage.url.startsWith('/uploads')
                  ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${article.newsImage.url}`
                  : article.newsImage.url}
                  alt={article.title}
                  className="max-w-[300px] h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* PDF File */}
          {article.pdfFile && (
            <div>
              <label className="text-sm font-semibold text-gray-600">PDF File</label>
              <div className="mt-1">
                <a
                  href={article.pdfFile.url || article.pdfFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download PDF
                </a>
              </div>
            </div>
          )}

          {/* Event Details */}
          {article.event_details && article.event_details.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Event Details</label>
              <div className="mt-1 space-y-3">
                {article.event_details.map((detail, index: number) => (
                  <div key={detail.id} className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-900">{detail.title}</h4>
                    <p className="text-sm text-green-800 mt-1">{detail.description}</p>
                    {detail.imagePosition && (
                      <p className="text-xs text-green-600 mt-1">Image Position: {detail.imagePosition}</p>
                    )}
                    {detail.image && detail.image.image && detail.image.image.url && (
                      <div className="mt-3">
                        <img
                          src={detail.image.image.url.startsWith('/uploads')
                          ? `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${detail.image.image.url}`
                          : detail.image.image.url}
                          alt={detail.image.alternateText || detail.title}
                          className="max-w-[300px] h-auto rounded-lg shadow-sm"
                        />
                        {detail.image.alternateText && (
                          <p className="text-xs text-gray-500 mt-1">Alt text: {detail.image.alternateText}</p>
                        )}
                        {detail.image.href && (
                          <a href={detail.image.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs mt-1 block">
                            {detail.image.href}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {article.newsStatus === "Pending" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center gap-4">
              {/* <PreviewButton slug={article.slug} /> */}
              <ApproveButton slug={article.slug} onApprove={handleApprove} />
              <RejectButton slug={article.slug} onReject={handleApprove} />
            </div>
          </div>
        )}

        {article.comments && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{article.comments}</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
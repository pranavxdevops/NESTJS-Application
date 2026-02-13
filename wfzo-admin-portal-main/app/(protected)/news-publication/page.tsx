"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { newsPublicationApi } from "@/lib/api/newsPublicationApi";
import { Article } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function NewsPublicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has admin role
    if (user?.token) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const userRoles = payload.roles || [];
        if (!userRoles.includes("ADMIN")) {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const pendingArticles = await newsPublicationApi.fetchPendingArticles();
        setArticles(pendingArticles);
        console.log("pendingArticles:", pendingArticles);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch articles");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchArticles();
    }
  }, [user]);

  const handleArticleClick = (slug: string) => {
    console.log("Navigating to article:", slug);
    router.push(`/news-publication/${slug}`);
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

  if (error) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-primary">News Publication Management</h2>
            <p className="text-gray-600 mt-1">Manage organization news publications and articles</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-primary">News Publication Management</h2>
          <p className="text-gray-600 mt-1">Manage organization news publications and articles</p>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No Pending Articles
              </h3>
              <p className="text-gray-600">
                There are no articles waiting for approval at the moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pending Articles ({articles.length})</h3>
              <p className="text-gray-600 mt-1">Click on an article to review and approve</p>
            </div>
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleArticleClick(article.slug)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{article.title}</h4>
                      <p className="text-gray-600 mt-1">{article.shortDescription}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {article.authorName && <span>Author: {article.authorName}</span>}
                        {article.organizationName && <span>Organization: {article.organizationName}</span>}
                        {article.createdAt && (
                          <span>
                            Created: {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
import { Article, StrapiResponse } from "@/lib/types/api";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL || "http://localhost:1337";

async function fetchStrapi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${STRAPI_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

export const newsPublicationApi = {
  // Fetch pending articles
  fetchPendingArticles: async (): Promise<Article[]> => {
    const data = await fetchStrapi<StrapiResponse<Article[]>>(
      "/api/articles?status=draft&filters[newsStatus][$eq]=Pending&populate=*",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    return data.data || [];
  },

  // Update article by slug
  updateArticle: async (
    slug: string,
    payload: Partial<Article>
  ): Promise<Article> => {
    // 1️⃣ Fetch draft article by slug
    const articleData = await fetchStrapi<StrapiResponse<Article[]>>(
      `/api/articles?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: "no-store"
      }
    );


    const article = articleData.data?.[0];


    if (!article) {
      throw new Error("Draft article not found");
    }

    // 2️⃣ Update by documentId (for draft content)
    const updated = await fetchStrapi<StrapiResponse<Article>>(
      `/api/articles/${article.documentId}?status=draft`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        body: JSON.stringify({
          data: payload
        }),
        cache: "no-store"
      }
    );

    return updated.data;
  },


  fetchArticleBySlug: async (slug: string): Promise<Article | null> => {
    const data = await fetchStrapi<StrapiResponse<Article[]>>(
      `/api/articles?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}&populate[newsImage][fields]=url&populate[pdfFile][fields]=url&populate[event_details][populate][image][populate][image][fields][0]=url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    return data.data?.[0] || null;
  },

  sendEmail: async (payload: any): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/article/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify(payload)
    });
  }
};
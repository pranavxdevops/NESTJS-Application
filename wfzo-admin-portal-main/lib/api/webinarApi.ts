import { Event, StrapiResponse, Webinar } from "@/lib/types/api";

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

export const webinarApi = {
  // Fetch pending webinars
  fetchPendingWebinars: async (): Promise<Event[]> => {
    const data = await fetchStrapi<StrapiResponse<Event[]>>(
      "/api/webinars?status=draft&filters[webinarStatus][$eq]=Pending&populate=*",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    return data.data || [];
  },

  // Update webinar by slug
  updateWebinar: async (
  slug: string,
  payload: Partial<Webinar>
): Promise<Webinar> => {
  // 1️⃣ Fetch draft webinar by slug
  const webinarData = await fetchStrapi<StrapiResponse<Webinar[]>>(
    `/api/webinars?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
      },
      cache: "no-store"
    }
  );


  const webinar = webinarData.data?.[0];


  if (!webinar) {
    throw new Error("Draft webinar not found");
  }

  // 2️⃣ Update by documentId (for draft content)
  const updated = await fetchStrapi<StrapiResponse<Webinar>>(
    `/api/webinars/${webinar.documentId}?status=draft`,
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


  fetchWebinarBySlug: async (slug: string): Promise<Webinar | null> => {
    const data = await fetchStrapi<StrapiResponse<Webinar[]>>(
      `/api/webinars?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][0]=url`,
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
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify(payload)
    });
  }
};
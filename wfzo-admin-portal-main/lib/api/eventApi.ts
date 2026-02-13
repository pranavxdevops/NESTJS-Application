import { Event, StrapiResponse } from "@/lib/types/api";

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

export const eventApi = {
  // Fetch pending events
  fetchPendingEvents: async (): Promise<Event[]> => {
    const data = await fetchStrapi<StrapiResponse<Event[]>>(
      "/api/events?status=draft&filters[eventStatus][$eq]=Pending&populate=*",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    return data.data || [];
  },

  // Update event by slug
  updateEvent: async (
  slug: string,
  payload: Partial<Event>
): Promise<Event> => {
  // 1️⃣ Fetch draft event by slug
  const eventData = await fetchStrapi<StrapiResponse<Event[]>>(
    `/api/events?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
      },
      cache: "no-store"
    }
  );
  

  const event = eventData.data?.[0];
  

  if (!event) {
    throw new Error("Draft event not found");
  }

  // 2️⃣ Update by documentId (for draft content)
  const updated = await fetchStrapi<StrapiResponse<Event>>(
    `/api/events/${event.documentId}?status=draft`,
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


  fetchEventBySlug: async (slug: string): Promise<Event | null> => {
    const data = await fetchStrapi<StrapiResponse<Event[]>>(
      `/api/events?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[event_details][populate][image][populate][image][fields][0]=url&populate[Seo][populate]=*`,
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
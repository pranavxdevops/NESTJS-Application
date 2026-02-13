export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL || 'http://localhost:1337';
const JWT_TOKEN = process.env.NEXT_PUBLIC_STRAPI_JWT || "";
type StrapiResponse<T = any> = {
  data: T;
  meta?: any;
};

export const strapi = {
  url: STRAPI_URL,
  emailUrl: process.env.NEXT_PUBLIC_AUTH_BFF_BASE_URL,
  SUBMIT_PATH: '/wfzo/api/v1',
  /* ----------------------------------
   * Upload media (images / pdf)
   * ---------------------------------- */
  async uploadDocument(file: File): Promise<number> {
    const formData = new FormData();
    formData.append('files', file);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'Upload failed');
    }

    const data = await res.json();
    return Number(data[0].id); // Strapi media ID
  },
  async upload(file: File): Promise<string> {
    const form = new FormData();
    form.append("files", file);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Upload failed");
    }

    const data = await res.json();
    const uploadedFile = Array.isArray(data) ? data[0] : data;

    // Return full public URL
    return `${STRAPI_URL}${uploadedFile.url}`;
},
eventApi: {
  // Fetch pending events
  fetchPendingEvents: async (): Promise<any[]> => {
    const data = await fetch(`${STRAPI_URL}/api/events?status=draft&filters[eventStatus][$eq]=Pending&populate[image][populate][image][fields][0]=url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    const json = await data.json();
    return json.data || [];
  },
  /* ----------------------------------
   * Create Event as Draft / Full Event
   * ---------------------------------- */
  async createEventCard(payload: any): Promise<StrapiResponse> {
    const res = await fetch(`${STRAPI_URL}/api/events?status=draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw err;
    }

    return res.json();
  },
    async publishEvents(eventId: string | number, payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },
  /* ----------------------------------
   * Update existing Draft / Rejected event
   * ---------------------------------- */
  async updateEvent(eventId: string | number, payload: any): Promise<StrapiResponse> {
    const res = await fetch(`${STRAPI_URL}/api/events/${eventId}?status=draft`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw err;
    }

    return res.json();
  },

  /* ----------------------------------
   * Delete Draft / Pending Event
   * ---------------------------------- */
  async deleteEvent(eventId: string | number): Promise<boolean> {
    const res = await fetch(`${STRAPI_URL}/api/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json();
      throw err;
    }

    return true;
    },

  /* ----------------------------------
   * Fetch Hosted Events (Draft + Published)
   * ---------------------------------- */
  fetchHostedEvents: async (organizer: string): Promise<any[]> => {
    // Fetch draft events
    const draftData = await fetch(`${STRAPI_URL}/api/events?status=draft&filters[organizer][$eq]=${encodeURIComponent(organizer)}&sort[0]=startDateTime:desc&pagination[pageSize]=100&populate[image][populate][image][fields][0]=url&populate[event_details][populate][image][populate][image][fields][0]=url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    const draftJson = await draftData.json();
    const draftEvents = draftJson.data || [];

    // Fetch published events
    const publishedData = await fetch(`${STRAPI_URL}/api/events?status=published&filters[organizer][$eq]=${encodeURIComponent(organizer)}&sort[0]=startDateTime:desc&pagination[pageSize]=100&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    const publishedJson = await publishedData.json();
    const publishedEvents = publishedJson.data || [];

    // Combine and sort by startDateTime ascending
    const allEvents = [...draftEvents, ...publishedEvents].sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.attributes?.startDateTime || 0);
      const dateB = new Date(b.startDateTime || b.attributes?.startDateTime || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Limit to 100 events
    return allEvents.slice(0, 100);
  },
  },
  webinarApi: {
    /* ----------------------------------
     * Create Webinar as Draft / Full Webinar
     * ---------------------------------- */
    async createWebinarCard(payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/webinars?status=draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },

    /* ----------------------------------
     * Update existing Draft / Rejected webinar
     * ---------------------------------- */
    async updateWebinar(webinarId: string | number, payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/webinars/${webinarId}?status=draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },
      async publishWebinar(webinarId: string | number, payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/webinars/${webinarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },

    /* ----------------------------------
     * Delete Draft / Pending Webinar
     * ---------------------------------- */
    async deleteWebinar(webinarId: string | number): Promise<boolean> {
      const res = await fetch(`${STRAPI_URL}/api/webinars/${webinarId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return true;
    },

    /* ----------------------------------
     * Fetch Hosted Webinars (Draft + Published)
     * ---------------------------------- */
    fetchHostedWebinars: async (organizer: string): Promise<any[]> => {
      // Fetch draft webinars
      const draftData = await fetch(`${STRAPI_URL}/api/webinars?status=draft&filters[organizer][$eq]=${encodeURIComponent(organizer)}&sort[0]=startDate:desc&pagination[pageSize]=100&populate[image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][0]=url`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
          },
          cache: 'no-store'
        }
      );
      const draftJson = await draftData.json();
      const draftWebinars = draftJson.data || [];

      // Fetch published webinars
      const publishedData = await fetch(`${STRAPI_URL}/api/webinars?status=published&filters[organizer][$eq]=${encodeURIComponent(organizer)}&sort[0]=startDate:desc&pagination[pageSize]=100&populate=*`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
          },
          cache: 'no-store'
        }
      );
      const publishedJson = await publishedData.json();
      const publishedWebinars = publishedJson.data || [];

      // Combine and sort by startDateTime ascending
      const allWebinars = [...draftWebinars, ...publishedWebinars].sort((a, b) => {
        const dateA = new Date(a.startDateTime || a.attributes?.startDateTime || 0);
        const dateB = new Date(b.startDateTime || b.attributes?.startDateTime || 0);
        return dateA.getTime() - dateB.getTime();
      });

      // Limit to 100 webinars
      return allWebinars.slice(0, 100);
    },
  },
  publicationApi: {
    /* ----------------------------------
      * Fetch Your Articles (Draft + Published)
      * ---------------------------------- */
    fetchYourArticles: async (organizer: string): Promise<any[]> => {
      // Fetch draft articles
      const draftData = await fetch(`${STRAPI_URL}/api/articles?status=draft&filters[organizationName][$eq]=${encodeURIComponent(organizer)}&populate[newsImage][fields]=url&populate[pdfFile][fields]=url&populate[event_details][populate][image][populate][image][fields][0]=url`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
          },
          cache: 'no-store'
        }
      );
      const draftJson = await draftData.json();
      const draftArticles = draftJson.data || [];

      // Fetch published articles
      const publishedData = await fetch(`${STRAPI_URL}/api/articles?status=published&filters[organizationName][$eq]=${encodeURIComponent(organizer)}&populate[newsImage][fields]=url&populate[pdfFile][fields]=url&populate[event_details][populate][image][populate][image][fields][0]=url`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
          },
          cache: 'no-store'
        }
      );
      const publishedJson = await publishedData.json();
      const publishedArticles = publishedJson.data || [];

      // Combine draft and published articles
      const allArticles = [...draftArticles, ...publishedArticles];

      // Remove duplicates by documentId if any
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index ===
        self.findIndex((a) =>
          (a.documentId || a.attributes?.documentId) ===
          (article.documentId || article.attributes?.documentId)
        )
      );

      // Sort by updatedAt descending
      const sortedArticles = uniqueArticles.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.attributes?.updatedAt || 0);
        const dateB = new Date(b.updatedAt || b.attributes?.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Limit to 100 articles
      return sortedArticles.slice(0, 100);
    },

    /* ----------------------------------
      * Create Article as Draft
      * ---------------------------------- */
    async createArticle(payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/articles?status=draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },

    /* ----------------------------------
      * Update existing Article
      * ---------------------------------- */
    async updateArticle(articleId: string | number, payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/articles/${articleId}?status=draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },

    /* ----------------------------------
      * Publish Article
      * ---------------------------------- */
    async publishArticle(articleId: string | number, payload: any): Promise<StrapiResponse> {
      const res = await fetch(`${STRAPI_URL}/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },

    /* ----------------------------------
      * Delete Article
      * ---------------------------------- */
    async deleteArticle(articleId: string | number): Promise<boolean> {
      const res = await fetch(`${STRAPI_URL}/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return true;
    },

    /* ----------------------------------
      * Send Email for Article Submission
      * ---------------------------------- */
    async sendArticleEmail(payload: any): Promise<StrapiResponse> {
      const res = await fetch('/api/article/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },
  }
}

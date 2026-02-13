import { Organization, StrapiResponse } from "@/lib/types/api";

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

export const organizationApi = {
  // Fetch pending organizations
  fetchPendingOrganizations: async (): Promise<Organization[]> => {
    const data = await fetchStrapi<StrapiResponse<Organization[]>>(
      "/api/organizations?status=draft&filters[companyStatus][$eq]=Pending&populate=*",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: 'no-store'
      }
    );
    return data.data || [];
  },

  // Update organization by slug
  updateOrganization: async (
    slug: string,
    payload: Partial<Organization>
  ): Promise<Organization> => {
    // 1️⃣ Fetch draft organization by slug
    const organizationData = await fetchStrapi<StrapiResponse<Organization[]>>(
      `/api/organizations?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        },
        cache: "no-store"
      }
    );

    const organization = organizationData.data?.[0];

    if (!organization) {
      throw new Error("Draft organization not found");
    }

    // 2️⃣ Update by documentId (for draft content)
    const updated = await fetchStrapi<StrapiResponse<Organization>>(
      `/api/organizations/${organization.documentId}${payload.companyStatus === "Rejected" ? '?status=draft' : ''}`,
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

  fetchOrganizationBySlug: async (slug: string): Promise<Organization | null> => {
    const data = await fetchStrapi<StrapiResponse<Organization[]>>(
      `/api/organizations?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}&populate[companyImage][fields]=url&populate[organization][populate][image][populate][image][fields][0]=url`,
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
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organization/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify(payload)
    });
  }
};
import { Enquiry } from "../types/api";

const API_BASE_URL = "/api";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" 
    ? JSON.parse(localStorage.getItem("wfzo_auth_user") || "{}")?.token 
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API Error: ${response.statusText}`
    );
  }

  return response.json();
}

export const enquiryApi = {
  getEnquiries: async (enquiryType?: string): Promise<Enquiry[]> => {
    const queryParams = new URLSearchParams();
    if (enquiryType) {
      queryParams.append("enquiryType", enquiryType);
    }
    const queryString = queryParams.toString();
    return fetchApi<Enquiry[]>(
      `/enquiries${queryString ? `?${queryString}` : ""}`
    );
  },

  getEnquiryById: async (id: string): Promise<Enquiry> => {
    return fetchApi<Enquiry>(`/enquiries/${id}`);
  },

  updateEnquiryStatus: async (id: string, enquiryStatus: 'approved' | 'rejected' | 'pending', comments?: string): Promise<Enquiry> => {
    return fetchApi<Enquiry>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enquiryStatus, ...(comments && { comments }) }),
    });
  },
};
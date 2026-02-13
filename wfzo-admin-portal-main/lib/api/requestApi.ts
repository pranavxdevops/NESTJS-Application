import { PageDataDto } from "../types/api";

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

export const requestApi = {
  getRequests: async (status?: string): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (status) {
      queryParams.append("status", status);
    }
    const queryString = queryParams.toString();
    const data = await fetchApi<PageDataDto<any>>(`/requests${queryString ? `?${queryString}` : ""}`);
    return data.items;
  },

  getRequestById: async (id: string): Promise<any> => {
    return fetchApi<any>(`/requests/${id}`);
  },

  updateRequestStatus: async (id: string, requestStatus: 'APPROVED' | 'REJECTED' | 'PENDING', comments?: string): Promise<any> => {
    return fetchApi<any>(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ requestStatus, ...(comments && { comments }) }),
    });
  },
};
import {
  InternalLoginRequestDto,
  InternalLoginResponseDto,
  InternalUser,
  Member,
  PageDataDto,
  UpdateStatusDto,
  UpdatePaymentLinkDto,
  UpdatePaymentStatusDto,
} from "@/lib/types/api";
import { getMockMembers, getMockMemberById } from "./mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API Error: ${response.statusText}`;
      // Log error gracefully without throwing
      console.warn(`API Warning (${response.status}): ${errorMessage}`);
      throw new ApiError(
        response.status,
        errorMessage
      );
    }

    return response.json();
  } catch (error) {
    // Re-throw ApiError, but log network errors gracefully
    if (error instanceof ApiError) {
      throw error;
    }
    // For network errors, log gracefully
    console.warn('Network error:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (credentials: InternalLoginRequestDto): Promise<InternalLoginResponseDto> => {
    return fetchApi<InternalLoginResponseDto>("/internal/user/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  getCurrentUser: async (): Promise<InternalUser> => {
    return fetchApi<InternalUser>("/internal/user/me");
  },
};

// Roles API
export const rolesApi = {
  getRoles: async (): Promise<any[]> => {
    return fetchApi<any[]>("/internal/user/roles/list");
  },
};

// Internal Users API
export const internalUsersApi = {
  createUser: async (userData: any): Promise<any> => {
    return fetchApi<any>("/internal/user", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  getAllUsers: async (): Promise<any[]> => {
    return fetchApi<any[]>("/internal/user");
  },
  getUserById: async (userId: string): Promise<any> => {
    return fetchApi<any>(`/internal/user/${userId}`);
  },
  updateUser: async (userId: string, userData: any): Promise<any> => {
    return fetchApi<any>(`/internal/user/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
  deleteUser: async (userId: string): Promise<void> => {
    return fetchApi<void>(`/internal/user/${userId}`, {
      method: "DELETE",
    });
  },
};

// Member API
export const memberApi = {
  // Get all members with optional filters
  searchMembers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    currentStage?: string;
  }): Promise<PageDataDto<Member>> => {
    if (USE_MOCK_AUTH) {
      // Return mock data for testing
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return getMockMembers(params);
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("pageSize", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.currentStage) queryParams.append("currentStage", params.currentStage);

    const queryString = queryParams.toString();
    return fetchApi<PageDataDto<Member>>(
      `/member${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get member by ID
  getMemberById: async (memberId: string): Promise<Member> => {
    if (USE_MOCK_AUTH) {
      // Return mock data for testing
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const member = getMockMemberById(memberId);
      if (!member) {
        throw new ApiError(404, "Member not found");
      }
      return member;
    }

    return fetchApi<Member>(`/member/${memberId}`);
  },

  // Approve member application
  approveMember: async (
    memberId: string,
    comment: string,
    actionBy: string,
    actionByEmail: string
  ): Promise<{ success: boolean; data?: Member; error?: string }> => {
    try {
      const data = await fetchApi<Member>(`/member/status/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({
          action: 'approve',
          comments: comment,
          actionBy,
          actionByEmail
        }),
      });
      return { success: true, data };
    } catch (error: any) {
      console.warn(`Member approval failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // Reject member application
  rejectMember: async (
    memberId: string,
    comment: string,
    actionBy: string,
    actionByEmail: string,
    stage: string
  ): Promise<{ success: boolean; data?: Member; error?: string }> => {
    try {
      const data = await fetchApi<Member>(`/member/status/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({
          action: 'reject',
          comments: comment,
          stage,
          actionBy,
          actionByEmail
        }),
      });
      return { success: true, data };
    } catch (error: any) {
      console.warn(`Member rejection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // Update payment link
  updatePaymentLink: async (
    memberId: string,
    paymentData: UpdatePaymentLinkDto
  ): Promise<Member> => {
    return fetchApi<Member>(`/member/payment-link/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    });
  },

  // Update payment status
  updatePaymentStatus: async (
    memberId: string,
    paymentStatus: UpdatePaymentStatusDto
  ): Promise<Member> => {
    return fetchApi<Member>(`/member/payment-status/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(paymentStatus),
    });
  },

  // Check payment status
  checkPaymentStatus: async (
    memberId: string
  ): Promise<Member> => {
    return fetchApi<Member>(`/member/payment-status/${memberId}`, {
      method: "GET"
    });
  },

  // Get payment details
  getPaymentDetails: async (
    memberId: string
  ): Promise<any> => {
    return fetchApi<Member>(`/member/payment-details/${memberId}`, {
      method: "GET"
    });
  },

  // Generate payment link
  generatePaymentLink: async (
    memberId: string
  ): Promise<Member> => {
    return fetchApi<Member>(`/member/payment/link/${memberId}`, {
      method: "GET"
    });
  },

  // Update member details (for featured member or additional team members)
  updateMemberDetails: async (
    memberId: string,
    updateData: { featuredMember?: boolean; allowedUserCount?: number }
  ): Promise<any> => {
    return fetchApi<any>(`/member/update/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },
};

export { ApiError };

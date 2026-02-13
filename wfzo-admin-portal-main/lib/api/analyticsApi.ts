const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export interface MembersByContinent {
  continent: string;
  count: number;
  percentage: number;
}

export interface MembershipRequestsTimeline {
  period: string;
  count: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface MemberGrowth {
  period: string;
  totalMembers: number;
  newMembers: number;
}

export interface EnquiriesTimeline {
  period: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface DashboardSummary {
  totalMembers: number;
  newMembersThisMonth: number;
  growthPercentage: number;
  pendingApprovals: number;
  totalEnquiries: number;
  pendingEnquiries: number;
}

export const analyticsApi = {
  async getMembersByContinent(): Promise<MembersByContinent[]> {
    const res = await fetch(`${API_URL}/analytics/members-by-continent`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch members by continent");
    }

    return res.json();
  },

  async getMembershipRequestsTimeline(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number
  ): Promise<MembershipRequestsTimeline[]> {
    const params = new URLSearchParams({ period });
    if (limit) params.append("limit", limit.toString());

    const res = await fetch(
      `${API_URL}/analytics/membership-requests?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch membership requests timeline");
    }

    return res.json();
  },

  async getMemberGrowth(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number
  ): Promise<MemberGrowth[]> {
    const params = new URLSearchParams({ period });
    if (limit) params.append("limit", limit.toString());

    const res = await fetch(
      `${API_URL}/analytics/member-growth?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch member growth");
    }

    return res.json();
  },

  async getEnquiriesTimeline(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number
  ): Promise<EnquiriesTimeline[]> {
    const params = new URLSearchParams({ period });
    if (limit) params.append("limit", limit.toString());

    const res = await fetch(
      `${API_URL}/analytics/enquiries?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch enquiries timeline");
    }

    return res.json();
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_URL}/analytics/dashboard-summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch dashboard summary");
    }

    return res.json();
  },
};

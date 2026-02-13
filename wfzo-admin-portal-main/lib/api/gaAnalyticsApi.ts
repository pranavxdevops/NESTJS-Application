const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  avgSessionDuration: number;
}

export interface TopArticle {
  articleId: string;
  title: string;
  views: number;
  uniqueReaders: number;
}

export interface TopMember {
  memberId: string;
  memberName: string;
  organization: string;
  profileViews: number;
  uniqueViewers: number;
}

export interface TopEvent {
  eventId: string;
  eventTitle: string;
  eventType: string;
  pageViews: number;
  uniqueVisitors: number;
}

export interface SearchQuery {
  searchTerm: string;
  searchCount: number;
  uniqueSearchers: number;
}

export interface UserBehavior {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  engagedSessions: number;
}

export interface UserTypeBreakdown {
  userType: string;
  users: number;
  sessions: number;
  pageViews: number;
}

export interface CountryTraffic {
  country: string;
  users: number;
  sessions: number;
  pageViews: number;
}

export interface TrafficOverTime {
  period: string;
  users: number;
  sessions: number;
  pageViews: number;
}

type Period = "daily" | "weekly" | "monthly" | "yearly";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("wfzo_access_token")}`,
});

export const gaAnalyticsApi = {
  async getTopPages(period: Period = "monthly", limit: number = 10): Promise<TopPage[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/top-pages?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch top pages");
    return res.json();
  },

  async getTopArticles(period: Period = "monthly", limit: number = 10): Promise<TopArticle[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/top-articles?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch top articles");
    return res.json();
  },

  async getTopMembers(period: Period = "monthly", limit: number = 10): Promise<TopMember[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/top-members?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch top members");
    return res.json();
  },

  async getTopEvents(period: Period = "monthly", limit: number = 10): Promise<TopEvent[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/top-events?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch top events");
    return res.json();
  },

  async getSearchAnalytics(period: Period = "monthly", limit: number = 20): Promise<SearchQuery[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/search-analytics?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch search analytics");
    return res.json();
  },

  async getUserBehavior(period: Period = "monthly"): Promise<UserBehavior> {
    const params = new URLSearchParams({ period });
    const res = await fetch(`${API_URL}/ga-analytics/user-behavior?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user behavior");
    return res.json();
  },

  async getUserTypes(period: Period = "monthly"): Promise<UserTypeBreakdown[]> {
    const params = new URLSearchParams({ period });
    const res = await fetch(`${API_URL}/ga-analytics/user-types?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user types");
    return res.json();
  },

  async getTrafficByCountry(period: Period = "monthly", limit: number = 10): Promise<CountryTraffic[]> {
    const params = new URLSearchParams({ period, limit: limit.toString() });
    const res = await fetch(`${API_URL}/ga-analytics/traffic-by-country?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch traffic by country");
    return res.json();
  },

  async getRealTimeUsers(): Promise<{ activeUsers: number }> {
    const res = await fetch(`${API_URL}/ga-analytics/realtime`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch real-time users");
    return res.json();
  },

  async getTrafficOverTime(
    period: Period = "monthly",
    granularity: "date" | "week" | "month" = "date"
  ): Promise<TrafficOverTime[]> {
    const params = new URLSearchParams({ period, granularity });
    const res = await fetch(`${API_URL}/ga-analytics/traffic-over-time?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch traffic over time");
    return res.json();
  },
};

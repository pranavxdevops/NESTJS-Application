"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  CountryTraffic,
  SearchQuery,
  TopArticle,
  TopEvent,
  TopMember,
  TopPage,
  TrafficOverTime,
  UserBehavior,
  gaAnalyticsApi,
} from "@/lib/api/gaAnalyticsApi";
import dynamic from "next/dynamic";

const TopPagesChart = dynamic(() => import("@/components/charts/TopPagesChart"), { ssr: false });
const TopArticlesChart = dynamic(() => import("@/components/charts/TopArticlesChart"), { ssr: false });
const TopMembersChart = dynamic(() => import("@/components/charts/TopMembersChart"), { ssr: false });
const TopEventsChart = dynamic(() => import("@/components/charts/TopEventsChart"), { ssr: false });
const UserBehaviorPieChart = dynamic(() => import("@/components/charts/UserBehaviorPieChart"), { ssr: false });
const TrafficOverTimeChart = dynamic(() => import("@/components/charts/TrafficOverTimeChart"), { ssr: false });
const CountryAccessChart = dynamic(() => import("@/components/charts/CountryAccessChart"), { ssr: false });

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function UserAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("weekly");
  
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [trafficOverTime, setTrafficOverTime] = useState<TrafficOverTime[]>([]);
  const [realTimeUsers, setRealTimeUsers] = useState<number>(0);
  const [trafficByCountry, setTrafficByCountry] = useState<CountryTraffic[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        pages,
        articles,
        members,
        events,
        behavior,
        searches,
        traffic,
        realtime,
        countryData,
      ] = await Promise.all([
        gaAnalyticsApi.getTopPages(period, 30).catch(() => []), // Increased to 30 to ensure all pages show after filtering and aggregation
        gaAnalyticsApi.getTopArticles(period, 10).catch(() => []),
        gaAnalyticsApi.getTopMembers(period, 10).catch(() => []),
        gaAnalyticsApi.getTopEvents(period, 10).catch(() => []),
        gaAnalyticsApi.getUserBehavior(period).catch(() => null),
        gaAnalyticsApi.getSearchAnalytics(period, 15).catch(() => []),
        gaAnalyticsApi.getTrafficOverTime(period, "date").catch(() => []),
        gaAnalyticsApi.getRealTimeUsers().catch(() => ({ activeUsers: 0 })),
        gaAnalyticsApi.getTrafficByCountry(period, 50).catch(() => []), // Increased limit to capture all countries
      ]);

      setTopPages(pages);
      setTopArticles(articles);
      setTopMembers(members);
      setTopEvents(events);
      setUserBehavior(behavior);
      setSearchQueries(searches);
      setTrafficOverTime(traffic);
      setRealTimeUsers(realtime.activeUsers);
      setTrafficByCountry(countryData);
      
      // Debug logging
      console.log('GA4 Analytics Data:', {
        period,
        countriesCount: countryData.length,
        countries: countryData.map(c => ({ country: c.country, users: c.users })),
        topPages: pages.length,
        topArticles: articles.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load analytics data";
      console.error("Failed to fetch analytics:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-red-500">
              Make sure the GA4 service account is configured correctly in your backend .env file.
              <br />
              Check the backend logs for more details.
            </p>
            <button
              onClick={fetchAllData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary">User Analytics</h2>
            <p className="text-gray-600 mt-1">Track user behavior and engagement</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        {/* Summary Cards */}
        {userBehavior && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Active Users Now</h3>
              <p className="text-3xl font-bold text-green-600">{realTimeUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-3xl font-bold text-primary">{userBehavior.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
              <p className="text-3xl font-bold text-blue-600">{userBehavior.sessions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Page Views</h3>
              <p className="text-3xl font-bold text-purple-600">{userBehavior.pageViews.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        {userBehavior && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg Session Duration</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {Math.floor(userBehavior.avgSessionDuration / 60)}m {Math.floor(userBehavior.avgSessionDuration % 60)}s
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Bounce Rate</h3>
              <p className="text-2xl font-bold text-orange-600">
                {(userBehavior.bounceRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Engaged Sessions</h3>
              <p className="text-2xl font-bold text-teal-600">{userBehavior.engagedSessions.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Traffic Over Time */}
        {trafficOverTime.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Traffic Over Time</h3>
            <TrafficOverTimeChart data={trafficOverTime} />
          </div>
        )}

        {/* User Behavior and Country Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userBehavior && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">User Behavior</h3>
              <UserBehaviorPieChart data={userBehavior} />
            </div>
          )}

          {trafficByCountry.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">User Access by Country</h3>
              <CountryAccessChart data={trafficByCountry} />
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Visited Pages</h3>
          {topPages.length > 0 ? (
            <TopPagesChart data={topPages} />
          ) : (
            <p className="text-gray-500 text-center py-8">No page view data available</p>
          )}
        </div>

        {/* Top Articles */}
        {/* Top Articles and Top Members - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Articles */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Most Read Articles</h3>
            {topArticles.length > 0 ? (
              <TopArticlesChart data={topArticles} />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No article data available. Custom dimensions may take 24-48 hours to activate.
              </p>
            )}
          </div>

          {/* Top Members */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Most Searched Members</h3>
            {topMembers.length > 0 ? (
              <TopMembersChart data={topMembers} />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No member data available. Custom dimensions may take 24-48 hours to activate.
              </p>
            )}
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Most Visited Events</h3>
          {topEvents.length > 0 ? (
            <TopEventsChart data={topEvents} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              No event data available. Custom dimensions may take 24-48 hours to activate.
            </p>
          )}
        </div>

        {/* Search Queries Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Search Queries</h3>
          {searchQueries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Search Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Searchers
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchQueries.map((query, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.searchTerm}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.searchCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.uniqueSearchers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No search data available. Custom dimensions may take 24-48 hours to activate.
            </p>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

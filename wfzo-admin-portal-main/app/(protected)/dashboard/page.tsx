"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import {
  DashboardSummary,
  EnquiriesTimeline,
  MemberGrowth,
  MembersByContinent,
  MembershipRequestsTimeline,
  analyticsApi,
} from "@/lib/api/analyticsApi";
import { memberApi } from "@/lib/api/memberApi";
import { Member } from "@/lib/types/api";
import dynamic from "next/dynamic";
import { USE_DEMO_DATA } from "@/lib/constants/demoConfig";

// Dynamically import charts to avoid SSR issues
const ContinentChart = dynamic(
  () => import("@/components/charts/ContinentChart"),
  { ssr: false }
);
const MembershipRequestsChart = dynamic(
  () => import("@/components/charts/MembershipRequestsChart"),
  { ssr: false }
);
const MemberGrowthChart = dynamic(
  () => import("@/components/charts/MemberGrowthChart"),
  { ssr: false }
);
const EnquiriesChart = dynamic(
  () => import("@/components/charts/EnquiriesChart"),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dashboard data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [continentData, setContinentData] = useState<MembersByContinent[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequestsTimeline[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiriesTimeline[]>([]);

  // Member list states
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const pageSize = 5;

  // Filter states
  const [requestPeriod, setRequestPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("weekly");
  const [growthPeriod, setGrowthPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("weekly");
  const [enquiryPeriod, setEnquiryPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("weekly");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, continents] = await Promise.all([
        analyticsApi.getDashboardSummary(),
        analyticsApi.getMembersByContinent(),
      ]);

      setSummary(summaryData);
      setContinentData(continents);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentUserRole = (): string => {
    if (typeof window === "undefined") return "";
    const storedRole = localStorage.getItem("wfzo_current_role");
    return storedRole || (user?.roles?.[0] || "");
  };

  const getStatusForRole = (role: string): string => {
    const statusMap: Record<string, string> = {
      MEMBERSHIP_COMMITTEE: "pendingCommitteeApproval",
      MEMBERSHIP_BOARD: "pendingBoardApproval",
      CEO: "pendingCEOApproval",
      FINANCE: "approvedPendingPayment",
    };
    return statusMap[role] || "";
  };

  const getTitleForRole = (role: string): string => {
    const titleMap: Record<string, string> = {
      MEMBERSHIP_COMMITTEE: "Pending Committee Approval",
      MEMBERSHIP_BOARD: "Pending Board Approval",
      CEO: "Pending CEO Approval",
      FINANCE: "Pending Payment",
      ADMIN: "Recent Member Applications",
    };
    return titleMap[role] || "Recent Member Applications";
  };

  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);

      // Get current role directly inside callback to avoid dependency issues
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("wfzo_current_role") : "";
      const currentRole = storedRole || (user?.roles?.[0] || "");
      
      // Get status filter based on role
      const statusMap: Record<string, string> = {
        MEMBERSHIP_COMMITTEE: "pendingCommitteeApproval",
        MEMBERSHIP_BOARD: "pendingBoardApproval",
        CEO: "pendingCEOApproval",
        FINANCE: "approvedPendingPayment",
      };
      const statusFilter = statusMap[currentRole] || "";

      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit: pageSize,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await memberApi.searchMembers(params);
      setMembers(response.items || []);
      setTotalMembers(response.page?.total || 0);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setMembersLoading(false);
    }
  }, [currentPage, pageSize, user?.roles]);

  const fetchMembershipRequests = useCallback(async () => {
    try {
      const data = await analyticsApi.getMembershipRequestsTimeline(
        requestPeriod
      );
      setMembershipRequests(data);
    } catch (err) {
      console.error("Failed to fetch membership requests:", err);
    }
  }, [requestPeriod]);

  const fetchMemberGrowth = useCallback(async () => {
    try {
      const data = await analyticsApi.getMemberGrowth(growthPeriod);
      setMemberGrowth(data);
    } catch (err) {
      console.error("Failed to fetch member growth:", err);
    }
  }, [growthPeriod]);

  const fetchEnquiries = useCallback(async () => {
    try {
      const data = await analyticsApi.getEnquiriesTimeline(enquiryPeriod);
      setEnquiries(data);
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
    }
  }, [enquiryPeriod]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchMembers();
    }
  }, [user, fetchDashboardData, fetchMembers]);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [currentPage, user, fetchMembers]);

  useEffect(() => {
    if (user) {
      fetchMembershipRequests();
    }
  }, [requestPeriod, user, fetchMembershipRequests]);

  useEffect(() => {
    if (user) {
      fetchMemberGrowth();
    }
  }, [growthPeriod, user, fetchMemberGrowth]);

  useEffect(() => {
    if (user) {
      fetchEnquiries();
    }
  }, [enquiryPeriod, user, fetchEnquiries]);

  type UserSnapshot = {
    userType?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  const getPrimaryUser = (member: Member): UserSnapshot | undefined => {
    const snapshots = member.userSnapshots as UserSnapshot[] | undefined;
    return (
      snapshots?.find((u) => u.userType === "Primary") ||
      snapshots?.[0]
    );
  };

  const formatDate = (date: string | { $date: string } | undefined) => {
    if (!date) return "N/A";
    try {
      const dateStr = typeof date === "string" ? date : date.$date;
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const totalPages = Math.ceil(totalMembers / pageSize);
  const currentRole = getCurrentUserRole();
  const currentStatus = getStatusForRole(currentRole);

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingSpinner />
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hi, {user?.displayName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0] || "Admin")}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your platform today
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {summary.totalMembers.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    +{summary.newMembersThisMonth} this month
                  </p>
                </div>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {(USE_DEMO_DATA ? 30 : summary.growthPercentage) > 0 ? "+" : ""}
                    {USE_DEMO_DATA ? 30 : summary.growthPercentage}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">vs last month</p>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {summary.pendingApprovals}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Awaiting review
                  </p>
                </div>
              </div>
            </div>

            {/* Enquiries */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enquiries</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {summary.totalEnquiries}
                  </p>
                  <p className="text-sm text-orange-600 mt-2">
                    {summary.pendingEnquiries} pending
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members by Continent */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Members by Continent
            </h2>
            <div className="h-80">
              {continentData.length > 0 ? (
                <ContinentChart data={continentData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Member Growth */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Member Growth
              </h2>
              <select
                value={growthPeriod}
                onChange={(e) =>
                  setGrowthPeriod(
                    e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                  )
                }
                className="text-sm border border-gray-300 rounded px-3 py-1"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="h-80">
              {memberGrowth.length > 0 ? (
                <MemberGrowthChart data={memberGrowth} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Membership Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Membership Requests
              </h2>
              <select
                value={requestPeriod}
                onChange={(e) =>
                  setRequestPeriod(
                    e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                  )
                }
                className="text-sm border border-gray-300 rounded px-3 py-1"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="h-80">
              {membershipRequests.length > 0 ? (
                <MembershipRequestsChart
                  data={membershipRequests}
                  period={requestPeriod}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Enquiries Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Enquiries Timeline
              </h2>
              <select
                value={enquiryPeriod}
                onChange={(e) =>
                  setEnquiryPeriod(
                    e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                  )
                }
                className="text-sm border border-gray-300 rounded px-3 py-1"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="h-80">
              {enquiries.length > 0 ? (
                <EnquiriesChart data={enquiries} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member Applications List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getTitleForRole(currentRole)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing {members.length} of {totalMembers} applications
              </p>
            </div>
            <button
              onClick={() =>
                router.push(
                  `/members${currentStatus ? `?status=${currentStatus}` : ""}`
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              View All →
            </button>
          </div>

          {membersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications at this time
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Application #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Organization Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => {
                      const primaryUser = getPrimaryUser(member);
                      return (
                        <tr
                          key={member._id || member.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {member.applicationNumber || member.memberId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-wrap">
                            <div className="text-sm font-medium text-gray-900">
                              {member?.organisationInfo?.companyName || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {primaryUser?.firstName} {primaryUser?.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {primaryUser?.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge
                              status={member.status || "PENDING"}
                              size="sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(member.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() =>
                                router.push(`/members/${member.memberId}`)
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

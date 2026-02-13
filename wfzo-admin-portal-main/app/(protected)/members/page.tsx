"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { memberApi } from "@/lib/api/memberApi";
import { Member } from "@/lib/types/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

function MembersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [currentPage, statusFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await memberApi.searchMembers(params);
      setMembers(response.items || []);
      setTotalItems(response.page?.total || 0);
      setTotalPages(Math.ceil((response.page?.total || 0) / 20));
    } catch (err) {
      setError("Failed to load members. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const getFilteredMembers = () => {
    if (!searchQuery) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(member => {
      const primaryUser = member.userSnapshots?.find((u: any) => u.userType === "Primary") || member.userSnapshots?.[0];
      const orgName = primaryUser?.firstName?.toLowerCase() || '';
      const email = primaryUser?.email?.toLowerCase() || '';
      const appNumber = member.applicationNumber?.toLowerCase() || '';
      
      return orgName.includes(query) || email.includes(query) || appNumber.includes(query);
    });
  };

  const filteredMembers = getFilteredMembers();

  const getPrimaryUser = (member: Member) => {
    return member.userSnapshots?.find((u: any) => u.userType === "Primary") || member.userSnapshots?.[0];
  };

  const formatDate = (date: string | { $date: string } | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateStr = typeof date === 'string' ? date : date.$date;
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendingCommitteeApproval': 'Pending Committee',
      'pendingBoardApproval': 'Pending Board',
      'pendingCEOApproval': 'Pending CEO',
      'pendingPayment': 'Pending Payment',
      'approved': 'Approved',
      'active': 'Active',
      'rejected': 'Rejected',
    };
    return statusMap[status] || status;
  };

  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">Member Applications</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            View and manage member applications
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="pendingCommitteeApproval">Pending Committee Approval</option>
                <option value="pendingBoardApproval">Pending Board Approval</option>
                <option value="pendingCEOApproval">Pending CEO Approval</option>
                <option value="approvedPendingPayment">Pending Payment</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Search by Organization Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Organization Name
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organization name, email, or app number..."
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Members Table */}
        {loading ? (
          <LoadingSpinner text="Loading members..." />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Application #
                      </th>
                      <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-sm text-gray-500">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const primaryUser = getPrimaryUser(member);
                        return (
                          <tr key={member._id || member.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {member.applicationNumber || member.memberId}
                            </td>
                            <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                              {member?.organisationInfo?.companyName || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                              <div>
                                {primaryUser?.firstName} {primaryUser?.lastName}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500 mt-1">
                                <StatusBadge status={member.status || 'PENDING'} size="sm" />
                              </div>
                            </td>
                            <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                              {primaryUser?.email || 'N/A'}
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={member.status || 'PENDING'} size="sm" />
                            </td>
                            <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {formatDate(member.createdAt)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                              <button
                                onClick={() => router.push(`/members/${member.memberId}`)}
                                className="text-primary hover:text-secondary font-medium"
                              >
                                View →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
}

export default function MembersListPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<LoadingSpinner />}> 
        <MembersListContent />
      </Suspense>
    </ProtectedLayout>
  );
}

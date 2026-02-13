"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { enquiryApi } from "@/lib/api/enquiryApi";
import { useRouter } from "next/navigation";
import { Enquiry } from "@/lib/types/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

function EnquiriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || "become_featured_member");

  const workflowTypes = ["become_featured_member", "request_additional_team_members"];
  const showStatus = workflowTypes.includes(currentTab);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await enquiryApi.getEnquiries(currentTab);
      setEnquiries(data);
    } catch (err) {
      setError("Failed to load enquiries. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const getFilteredEnquiries = () => {
    if (!searchQuery) return enquiries;
    
    const query = searchQuery.toLowerCase();
    return enquiries.filter(enquiry => {
      const fullName = `${enquiry.userDetails.firstName} ${enquiry.userDetails.lastName}`.toLowerCase();
      const orgName = enquiry.userDetails.organizationName.toLowerCase();
      const email = enquiry.userDetails.email.toLowerCase();
      const message = enquiry.message.toLowerCase();
      
      return fullName.includes(query) || orgName.includes(query) || email.includes(query) || message.includes(query);
    });
  };

  const filteredEnquiries = getFilteredEnquiries();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { key: "become_featured_member", label: "Become Featured Member" },
    { key: "submit_question", label: "Submit Question" },
    { key: "learn_more", label: "Learn More" },
    { key: "consultancy_needs", label: "Consultancy Needs" },
    { key: "request_additional_team_members", label: "Request Additional Team Members" },
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">Enquiries</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            View and manage user enquiries
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  currentTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, organization, email, or message..."
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Enquiries Table */}
        {loading ? (
          <LoadingSpinner text="Loading enquiries..." />
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Message
                    </th>
                    {showStatus && (
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan={showStatus ? 8 : 7} className="px-3 sm:px-6 py-8 text-center text-sm text-gray-500">
                        No enquiries found
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((enquiry) => (
                      <tr
                        key={enquiry._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/enquiries/${enquiry._id}`)}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {enquiry._id.slice(-8)}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {enquiry.userDetails.firstName} {enquiry.userDetails.lastName}
                          </div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            <StatusBadge status={(enquiry.enquiryStatus || 'PENDING').toUpperCase()} size="sm" />
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                          {enquiry.userDetails.organizationName}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                          {enquiry.userDetails.country}
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                          {enquiry.userDetails.email}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={enquiry.message}>
                          {enquiry.message}
                        </td>
                        {showStatus && (
                          <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={(enquiry.enquiryStatus || 'PENDING').toUpperCase()} size="sm" />
                          </td>
                        )}
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {formatDate(enquiry.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EnquiriesContent />
    </Suspense>
  );
}
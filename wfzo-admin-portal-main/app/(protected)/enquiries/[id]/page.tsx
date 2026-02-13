"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { enquiryApi } from "@/lib/api/enquiryApi";
import { Enquiry } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ApproveButton from "../components/ApproveButton";
import RejectButton from "../components/RejectButton";

export default function EnquiryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<string>("");

  const fetchEnquiry = useCallback(async () => {
    try {
      setLoading(true);
      const data = await enquiryApi.getEnquiryById(id);
      setEnquiry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch enquiry");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEnquiry();
    }
  }, [id, fetchEnquiry]);

  const handleApprove = () => {
    // Refresh the enquiry data after approval
    setComments("");
    fetchEnquiry();
  };

  const handleReject = () => {
    // Refresh the enquiry data after rejection
    setComments("");
    fetchEnquiry();
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !enquiry) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/enquiries")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Enquiries
            </button>
            <h2 className="text-3xl font-bold text-primary">Enquiry Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Enquiry not found"}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEnquiryTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      become_featured_member: "Become Featured Member",
      submit_question: "Submit Question",
      learn_more: "Learn More",
      consultancy_needs: "Consultancy Needs",
      request_additional_team_members: "Request Additional Team Members",
    };
    return typeMap[type] || type;
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push("/enquiries")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Enquiries
          </button>
          <h2 className="text-3xl font-bold text-primary">
            Enquiry #{enquiry._id.slice(-8)}
          </h2>
          <p className="text-gray-600 mt-1">Enquiry Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* User Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600">Full Name</label>
                <p className="mt-1 text-gray-900">
                  {enquiry.userDetails.firstName} {enquiry.userDetails.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Organization</label>
                <p className="mt-1 text-gray-900">{enquiry.userDetails.organizationName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <p className="mt-1 text-gray-900">{enquiry.userDetails.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Phone</label>
                <p className="mt-1 text-gray-900">{enquiry.userDetails.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Country</label>
                <p className="mt-1 text-gray-900">{enquiry.userDetails.country}</p>
              </div>
            </div>
          </div>

          {/* Enquiry Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enquiry Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600">Enquiry Type</label>
                <p className="mt-1 text-gray-900">{getEnquiryTypeLabel(enquiry.enquiryType)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Status</label>
                <p className="mt-1 text-gray-900">{enquiry.enquiryStatus || "PENDING"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Created At</label>
                <p className="mt-1 text-gray-900">{formatDate(enquiry.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Updated At</label>
                <p className="mt-1 text-gray-900">{formatDate(enquiry.updatedAt)}</p>
              </div>
              {enquiry.enquiryType === "request_additional_team_members" && enquiry.noOfMembers !== undefined && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Number of Members Requested</label>
                  <p className="mt-1 text-gray-900">{enquiry.noOfMembers}</p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold text-gray-600">Message</label>
            <div className="mt-1 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{enquiry.message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {enquiry.enquiryStatus === "pending" &&
           (enquiry.enquiryType === "become_featured_member" || enquiry.enquiryType === "request_additional_team_members") && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              {/* Comments Input */}
              <div>
                <label htmlFor="comments" className="block text-sm font-semibold text-gray-600 mb-2">
                  Comments
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter your comments or reason for approval/rejection..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-4 pt-2">
                <ApproveButton id={enquiry._id} enquiry={enquiry} comments={comments} onApprove={handleApprove} />
                <RejectButton id={enquiry._id} comments={comments} onReject={handleReject} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
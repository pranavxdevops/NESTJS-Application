"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { requestApi } from "@/lib/api/requestApi";
import { Request } from "@/lib/types/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ApproveButton from "../components/ApproveButton";
import RejectButton from "../components/RejectButton";

export default function RequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<string>("");

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requestApi.getRequestById(id);
      setRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch request");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id, fetchRequest]);

  const handleApprove = () => {
    // Refresh the request data after approval
    setComments("");
    fetchRequest();
  };

  const handleReject = () => {
    // Refresh the request data after rejection
    setComments("");
    fetchRequest();
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

  if (error || !request) {
    return (
      <ProtectedLayout>
        <div className="space-y-6">
          <div>
            <button
              onClick={() => router.push("/requests")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Requests
            </button>
            <h2 className="text-3xl font-bold text-primary">Request Details</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Request not found"}</p>
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

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push("/requests")}
            className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Requests
          </button>
          <h2 className="text-3xl font-bold text-primary">
            Request #{request._id.slice(-8)}
          </h2>
          <p className="text-gray-600 mt-1">Request Details</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Organisation Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organisation Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600">Company Name</label>
                <p className="mt-1 text-gray-900">{request.organisationInfo.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Member ID</label>
                <p className="mt-1 text-gray-900">{request.memberId}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Organization Type</label>
                <p className="mt-1 text-gray-900">{request.organisationInfo.typeOfTheOrganization}</p>
              </div>
               <div>
                <label className="text-sm font-semibold text-gray-600">Position</label>
                <p className="mt-1 text-gray-900">{request.organisationInfo.position}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Website</label>
                <p className="mt-1 text-gray-900">
                  {request.organisationInfo.websiteUrl ? (
                    <a href={request.organisationInfo.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {request.organisationInfo.websiteUrl}
                    </a>
                  ) : "N/A"}
                </p>
              </div>
              {request.organisationInfo.socialMediaHandle?.length ? (
  request.organisationInfo.socialMediaHandle.map((social, index) => (
    <div key={index}>
      <label className="text-sm font-semibold text-gray-600">
        {social.title.charAt(0).toUpperCase() + social.title.slice(1)}
      </label>

      <p className="mt-1 text-gray-900">
        <a
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {social.url}
        </a>
      </p>
    </div>
  ))
) : (
  <div>
    <label className="text-sm font-semibold text-gray-600">Social Media</label>
    <p className="mt-1 text-gray-900">N/A</p>
  </div>
)}


              <div>
                <label className="text-sm font-semibold text-gray-600">Industries</label>
                <p className="mt-1 text-gray-900">{request.organisationInfo.industries?.join(', ') || 'N/A'}</p>
              </div>


{request.organisationInfo.memberLogoUrl && (
  <div>
    <label className="text-sm font-semibold text-gray-600">
      Company Logo
    </label>

    <div className="mt-2">
      <a
        href={request.organisationInfo.memberLogoUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={request.organisationInfo.memberLogoUrl}
          alt="Company Logo"
          className="w-28 h-28 object-contain border border-gray-200 rounded-lg hover:opacity-80 transition"
        />
      </a>
    </div>
  </div>
)}




              <div>
                <label className="text-sm font-semibold text-gray-600">Status</label>
                <p className="mt-1 text-gray-900">{request.requestStatus}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Created At</label>
                <p className="mt-1 text-gray-900">{formatDate(request.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Updated At</label>
                <p className="mt-1 text-gray-900">{formatDate(request.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Comments */}
          {request.comments && (
            <div>
              <label className="text-sm font-semibold text-gray-600">Comments</label>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{request.comments}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {request.requestStatus === "PENDING" && (
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
                <ApproveButton id={request._id} comments={comments} onApprove={handleApprove} />
                <RejectButton id={request._id} comments={comments} onReject={handleReject} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
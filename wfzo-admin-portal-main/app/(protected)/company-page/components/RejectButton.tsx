"use client";

import { useState } from "react";
import { organizationApi } from "@/lib/api/organizationApi";
import { useAuth } from "@/context/AuthContext";

interface RejectButtonProps {
  slug: string;
  onReject?: () => void;
}

export default function RejectButton({ slug, onReject }: RejectButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const { user} = useAuth();
  const handleReject = async () => {

    if (!comments.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      await organizationApi.updateOrganization(slug, {
        companyStatus: "Rejected",
        comments: comments
      });

      // Send email non-blocking
      organizationApi.fetchOrganizationBySlug(slug).then(fullOrganization => {
        if (fullOrganization) {
          organizationApi.sendEmail({
            email: fullOrganization.authorEmail,
            type: "ORGANIZATION_REJECTED_USER",
            title: fullOrganization.organizationName,
            description: fullOrganization.companyIntro || fullOrganization.organizationName,
            rejectionReason: comments || "Reason not provided",          
            organizerName: fullOrganization.organizationName,           
          }).catch(() => {});
        }
      }).catch(() => {});
       alert("Company info rejected successfully!");

      setShowModal(false);
      setComments("");
      onReject?.();
    } catch (error) {
      alert("Failed to reject company info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setShowModal(true)}
      >
        Reject Company Info
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Company Info</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please provide detailed reason for rejection..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !comments.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
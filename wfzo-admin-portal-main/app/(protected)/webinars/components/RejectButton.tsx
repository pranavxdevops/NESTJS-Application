"use client";

import { useState } from "react";
import { webinarApi } from "@/lib/api/webinarApi";
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
      await webinarApi.updateWebinar(slug, {
        webinarStatus: "Rejected",
        comments: comments
      });

      // Send email non-blocking
      webinarApi.fetchWebinarBySlug(slug).then(fullWebinar => {
        if (fullWebinar) {
          webinarApi.sendEmail({
            email: fullWebinar.authorEmail,
            type: "EVENT_REJECTED_USER",
            eventTitle: fullWebinar.title,
            scheduledDate: fullWebinar.startDate,
            rejectionReason: comments,
            organizerName: fullWebinar.organizer,
            firstName: fullWebinar.authorName?.split(' ')[0],
            lastName: fullWebinar.authorName?.split(' ').slice(1).join(' '),
            eventCode: fullWebinar.slug,
          }).catch(() => {});
        }
      }).catch(() => {});
       alert("Webinar rejected successfully!");

      setShowModal(false);
      setComments("");
      onReject?.();
    } catch (error) {
      alert("Failed to reject webinar");
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
        Reject Webinar
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Webinar</h3>
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
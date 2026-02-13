"use client";

import { useState } from "react";
import { enquiryApi } from "@/lib/api/enquiryApi";
import { toast } from "react-toastify";

interface RejectButtonProps {
  id: string;
  comments?: string;
  onReject?: () => void;
}

export default function RejectButton({ id, comments, onReject }: RejectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReject = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await enquiryApi.updateEnquiryStatus(id, "rejected", comments);
      toast.success("Enquiry rejected successfully!");
      onReject?.();
    } catch (error) {
      console.error("Error rejecting enquiry:", error);
      toast.error("Failed to reject enquiry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleReject}
      disabled={isLoading}
      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Rejecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </>
      )}
    </button>
  );
}
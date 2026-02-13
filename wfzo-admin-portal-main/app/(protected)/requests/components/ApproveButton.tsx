"use client";

import { useState } from "react";
import { requestApi } from "@/lib/api/requestApi";
import { memberApi } from "@/lib/api/memberApi";
import { toast } from "react-toastify";

interface ApproveButtonProps {
  id: string;
  comments?: string;
  onApprove?: () => void;
}

export default function ApproveButton({ id, comments, onApprove }: ApproveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Update request status
      await requestApi.updateRequestStatus(id, "APPROVED", comments);
      
      // Update member status to APPROVED
      // Assuming memberApi has updateMemberStatus method
      // You may need to adjust based on actual memberApi
      const memberUpdateData = { status: "APPROVED" };
      // await memberApi.updateMemberStatus(memberId, "APPROVED"); // memberId needs to be passed or fetched
      
      toast.success("Request approved successfully!");
      onApprove?.();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Approving...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </>
      )}
    </button>
  );
}
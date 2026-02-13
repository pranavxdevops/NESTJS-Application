"use client";

import { useState } from "react";
import { enquiryApi } from "@/lib/api/enquiryApi";
import { memberApi } from "@/lib/api/memberApi";
import { Enquiry } from "@/lib/types/api";
import { toast } from "react-toastify";

interface ApproveButtonProps {
  id: string;
  enquiry?: Enquiry;
  comments?: string;
  onApprove?: () => void;
}

export default function ApproveButton({ id, enquiry, comments, onApprove }: ApproveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Update enquiry status
      await enquiryApi.updateEnquiryStatus(id, "approved", comments);
      
      // If enquiry is for featured member or additional team members, update member details
      if (enquiry?.memberId) {
        const updateData: { featuredMember?: boolean; allowedUserCount?: number } = {};
        
        if (enquiry.enquiryType === "become_featured_member") {
          updateData.featuredMember = true;
        } else if (enquiry.enquiryType === "request_additional_team_members" && enquiry.noOfMembers !== undefined) {
          updateData.allowedUserCount = enquiry.noOfMembers;
        }
        
        if (Object.keys(updateData).length > 0) {
          await memberApi.updateMemberDetails(enquiry.memberId, updateData);
        }
      }
      
      toast.success("Enquiry approved successfully!");
      onApprove?.();
    } catch (error) {
      console.error("Error approving enquiry:", error);
      toast.error("Failed to approve enquiry. Please try again.");
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
"use client";

import { useAuth } from "@/context/AuthContext";
import { organizationApi } from "@/lib/api/organizationApi";

interface ApproveButtonProps {
  slug: string;
  onApprove?: () => void;
}

export default function ApproveButton({ slug, onApprove }: ApproveButtonProps) {
  const { user} = useAuth();
  const handleApprove = async () => {
    try {
      await organizationApi.updateOrganization(slug, {
        companyStatus: "Published"
      });
      alert("Company info approved successfully!");

      // Send email non-blocking
      organizationApi.fetchOrganizationBySlug(slug).then(fullOrganization => {
        if (fullOrganization) {
          organizationApi.sendEmail({
            email: fullOrganization.authorEmail,
            type: "ORGANIZATION_APPROVED_USER",
            title: fullOrganization.organizationName,
            description: fullOrganization.companyIntro || fullOrganization.organizationName,
            organizerName: fullOrganization.organizationName,
          }).catch(() => {});
        }
        console.log('Fetched organization for approval email:', fullOrganization);
      }).catch(() => {});

      onApprove?.();
    } catch (error) {
      alert("Failed to approve company info");
    }
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleApprove}
    >
      Approve Company Info
    </button>
  );
}
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { memberApi } from "@/lib/api/memberApi";
import { Member } from "@/lib/types/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { useAutoRefreshUrl } from "@/lib/blob/useAutoRefreshUrl";

export default function MemberDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const memberId = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Memoize orgInfo to prevent unnecessary re-renders
  const orgInfo = useMemo(() => member?.organisationInfo || {}, [member?.organisationInfo]);
  
  // Memoize URL data to prevent recreating objects on every render
  const logoUrlData = useMemo(() => {
    if (orgInfo.memberLogoUrlExpiresAt && orgInfo.memberLogoUrl) {
      return { 
        url: orgInfo.memberLogoUrl, 
        expiresAt: orgInfo.memberLogoUrlExpiresAt, 
        expiresIn: orgInfo.memberLogoUrlExpiresIn 
      };
    }
    return orgInfo.memberLogoUrl || null;
  }, [orgInfo.memberLogoUrl, orgInfo.memberLogoUrlExpiresAt, orgInfo.memberLogoUrlExpiresIn]);
  
  const { url: logoUrl } = useAutoRefreshUrl(logoUrlData, {
    autoRefresh: false, // Disable auto-refresh for admin portal to avoid unnecessary requests
  });

  const licenseUrlData = useMemo(() => {
    if (orgInfo.memberLicenceUrlExpiresAt && orgInfo.memberLicenceUrl) {
      return { 
        url: orgInfo.memberLicenceUrl, 
        expiresAt: orgInfo.memberLicenceUrlExpiresAt, 
        expiresIn: orgInfo.memberLicenceUrlExpiresIn 
      };
    }
    return orgInfo.memberLicenceUrl || null;
  }, [orgInfo.memberLicenceUrl, orgInfo.memberLicenceUrlExpiresAt, orgInfo.memberLicenceUrlExpiresIn]);
  
  const { url: licenseUrl } = useAutoRefreshUrl(licenseUrlData, {
    autoRefresh: false, // Disable auto-refresh for admin portal to avoid unnecessary requests
  });

  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  useEffect(() => {
    if (memberId && canManagePayment()) {
      getPaymentDetails();
    }
  }, [memberId, member?.status]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await memberApi.getMemberById(memberId);
      setMember(data);
      setPaymentLink(data.paymentLink || "");
    } catch (err) {
      setError("Failed to load member details. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = async () => {
    if (!memberId) return;
    try {
      const data = await memberApi.getPaymentDetails(memberId);
      setPaymentDetails(data);
    } catch (err) {
      console.error("Failed to load payment details:", err);
    }
  };

  const getCurrentUserRole = (): string => {
    if (typeof window === 'undefined') return '';
    const storedRole = localStorage.getItem('wfzo_current_role');
    return storedRole || (user?.roles?.[0] || '');
  };

  const canApprove = (): boolean => {
    const currentRole = getCurrentUserRole();
    const status = member?.status;

    if (!currentRole || !status) return false;

    // Check if user's role matches the current approval stage
    if (status === 'pendingCommitteeApproval' && currentRole === 'MEMBERSHIP_COMMITTEE') return true;
    if (status === 'pendingBoardApproval' && currentRole === 'MEMBERSHIP_BOARD') return true;
    if (status === 'pendingCEOApproval' && currentRole === 'CEO') return true;

    return false;
  };

  const canManagePayment = (): boolean => {
    const currentRole = getCurrentUserRole();
    const status = member?.status;
    return currentRole === 'FINANCE' && (status === 'approvedPendingPayment' || status === 'approved');
  };

  const getCurrentStage = (): string => {
    const status = member?.status;
    if (status === 'pendingCommitteeApproval') return 'COMMITTEE';
    if (status === 'pendingBoardApproval') return 'BOARD';
    if (status === 'pendingCEOApproval') return 'CEO';
    return 'COMMITTEE'; // default
  };

  const handleApprove = async () => {
    if (!comment.trim()) {
      setError("Please provide a comment for approval");
      return;
    }

    setActionLoading(true);
    setError("");

    const actionBy = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'Unknown';
    const actionByEmail = user?.email || '';

    const result = await memberApi.approveMember(memberId, comment, actionBy, actionByEmail);

    if (result.success) {
      setComment("");
      await fetchMember();
      toast.success("Member application approved successfully!");
    } else {
      const errorMessage = result.error || "Failed to approve member application";
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    if (!confirm("Are you sure you want to reject this application?")) {
      return;
    }

    setActionLoading(true);
    setError("");

    const actionBy = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'Unknown';
    const actionByEmail = user?.email || '';

    const result = await memberApi.rejectMember(memberId, comment, actionBy, actionByEmail, getCurrentStage());

    if (result.success) {
      setComment("");
      await fetchMember();
      toast.success("Member application rejected successfully!");
    } else {
      const errorMessage = result.error || "Failed to reject member application";
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setActionLoading(false);
  };

  const handleUpdatePaymentLink = async () => {
    if (!paymentLink.trim()) {
      setError("Please provide a payment link");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      await memberApi.updatePaymentLink(memberId, { paymentLink });
      await fetchMember();
      toast.success("Payment link updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update payment link");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Are you sure you want to mark this as paid?")) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      await memberApi.updatePaymentStatus(memberId, { paymentStatus: "paid" });
      await fetchMember();
      toast.success("Payment status updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update payment status");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      setActionLoading(true);
      setError("");
      const paymentDetails = await memberApi.checkPaymentStatus(memberId);
      setPaymentDetails(paymentDetails);
      await fetchMember();
      toast.success("Payment status fetched successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update payment status");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const generatePaymentLink = async () => {
    try {
      setActionLoading(true);
      setError("");
      await memberApi.generatePaymentLink(memberId);
      await fetchMember();
      toast.success("Payment link updated successfully!");
      await getPaymentDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update payment link");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getPaymentStatus = () => {
    if(paymentDetails?.isPaymentLinkExpired){
      return 'expired';
    }
    return paymentDetails?.status || member?.paymentStatus || 'pending';
  };

  const getPrimaryUser = () => {
    return member?.userSnapshots?.find((u: any) => u.userType === "Primary") || member?.userSnapshots?.[0];
  };

  const formatDate = (date: string | { $date: string } | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateStr = typeof date === 'string' ? date : date.$date;
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingSpinner text="Loading member details..." />
      </ProtectedLayout>
    );
  }

  if (!member) {
    return (
      <ProtectedLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Member not found
        </div>
      </ProtectedLayout>
    );
  }

  const primaryUser = getPrimaryUser();
  const address = orgInfo.address || {};

  return (
    <ProtectedLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-primary hover:text-secondary font-medium mb-2 flex items-center gap-2 text-sm sm:text-base"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-words">
              Member Application: {member.applicationNumber || member.memberId}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {primaryUser?.firstName} {primaryUser?.lastName}
            </p>
          </div>
          <div className="self-start">
            <StatusBadge status={member.status || 'PENDING'} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Organization Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
            Organization Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Name</label>
              <p className="mt-1 text-gray-900">{member.organisationInfo?.companyName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Type</label>
              <p className="mt-1 text-gray-900">{orgInfo.typeOfTheOrganization}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Industry</label>
              <p className="mt-1 text-gray-900">
                {orgInfo.industries?.join(', ') || 'Ipsum'}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Website</label>
              <p className="mt-1 text-gray-900">{orgInfo.websiteUrl}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Organization Contact Number</label>
              <p className="mt-1 text-gray-900 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  {primaryUser?.contactNumber || '4 123 4567'}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Membership Type</label>
              <p className="mt-1 text-gray-900 capitalize">
                {member.category?.replace('votingMember', 'Voting Member') || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Contact First Name</label>
              <p className="mt-1 text-gray-900">{primaryUser?.firstName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Contact Last Name</label>
              <p className="mt-1 text-gray-900">{primaryUser?.lastName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Position</label>
              <p className="mt-1 text-gray-900">{orgInfo.position || 'Marketing Manager'}</p>
            </div>

            <div></div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Primary Contact E-mail</label>
              <p className="mt-1 text-gray-900">{primaryUser?.email || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Phone Number</label>
              <p className="mt-1 text-gray-900 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  {primaryUser?.contactNumber || '4 123 4567'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Organization Address */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
            Organization Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Address Line 1</label>
              <p className="mt-1 text-gray-900">{address.line1 || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Address Line 2</label>
              <p className="mt-1 text-gray-900">{address.line2 || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Country</label>
              <p className="mt-1 text-gray-900">{address.country || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">State</label>
              <p className="mt-1 text-gray-900">{address.state || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">City</label>
              <p className="mt-1 text-gray-900">{address.city || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Province</label>
              <p className="mt-1 text-gray-900">{address.state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
            Terms & Conditions
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={member.memberConsent?.articleOfAssociationConsent || false}
                disabled
                className="mt-1 h-4 w-4"
              />
              <label className="text-sm text-gray-700">
                I hereby agree that I have read, understood to fully support and be bound by the Articles of Association 
                and Policy of the World FZO and agree to be admitted as a member of the Organisation
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={member.memberConsent?.articleOfAssociationCriteriaConsent || false}
                disabled
                className="mt-1 h-4 w-4"
              />
              <label className="text-sm text-gray-700">
                I also confirm that my organisation or entity meets each of the criteria as set out below in Criteria 
                for Admission in Articles of Association
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={member.memberConsent?.memberShipFeeConsent || false}
                disabled
                className="mt-1 h-4 w-4"
              />
              <label className="text-sm text-gray-700">
                I am obliged to pay the Annual Membership fees. Membership fees are payable at the beginning of every year. 
                Membership fees will not be refunded.
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Signatory Name*</label>
              <p className="mt-1 text-gray-900">{orgInfo.signatoryName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Signatory Position*</label>
              <p className="mt-1 text-gray-900">{orgInfo.signatoryPosition || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Application Date*</label>
              <p className="mt-1 text-gray-900">{formatDate(member.createdAt)}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Signature</label>
              {orgInfo.signature ? (
                orgInfo.signature.startsWith('http') ? (
                  <div className="mt-1 border border-gray-300 rounded p-2 bg-gray-50">
                    <a
                      href={orgInfo.signature}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <img
                        src={orgInfo.signature}
                        alt="Signature"
                        className="max-h-20 object-contain"
                      />
                    </a>
                  </div>
                ) : orgInfo.signature.startsWith('data:image/') ? (
                  <div className="mt-1 border border-gray-300 rounded p-2 bg-gray-50">
                    <img
                      src={orgInfo.signature}
                      alt="Signature"
                      className="max-h-20 object-contain"
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-gray-900 font-signature">{orgInfo.signature}</p>
                )
              ) : (
                <p className="mt-1 text-gray-500">No signature</p>
              )}
            </div>

            
          </div>
          
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
            Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-600">Logo</label>
              {logoUrl ? (
                <div className="mt-1 border border-gray-300 rounded p-5 bg-gray-50">
                  <a
                  href={logoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <img 
                    src={logoUrl} 
                    alt="logo" 
                    className="max-h-20 object-contain"
                  />
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-gray-500">No Logo Added</p>
              )}
            </div>
            <div>
            <label className="text-sm font-semibold text-gray-600">License</label>

            {licenseUrl ? (
              <div className="mt-1 rounded p-2 flex items-center gap-2">
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-700 underline"
                >
                  {/* PDF Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-red-600"
                  >
                    <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0013.172 2H6zm7 1.5L18.5 9H14a1 1 0 01-1-1V3.5z"/>
                    <path
                      fillRule="evenodd"
                      d="M8 13a1 1 0 011-1h1.5a2.5 2.5 0 010 5H10v1a1 1 0 11-2 0v-5zm2.5 2a.5.5 0 000-1H10v1h.5zm3.5-3a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm3 0a1 1 0 011 1v1h.5a1 1 0 110 2H18v1a1 1 0 11-2 0v-4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>

                  {/* License Document */}
                  {(() => {
                    const filename = licenseUrl.split('/').pop();
                    const extension = filename?.split('.').pop();
                    return `license_document.${extension}`;
                  })()}
                </a>
              </div>
            ) : (
              <p className="mt-1 text-gray-500">No License Added</p>
            )}
          </div>

            </div>
            </div>

        {/* Approval History */}
        {(member.approvalHistory && member.approvalHistory.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
              Workflow History
            </h3>
            <div className="space-y-3">
              {member.approvalHistory.map((approval: any, index: number) => (
                <div key={index} className="border-l-4 border-green-500 pl-3 sm:pl-4 py-2 bg-green-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 capitalize">{approval.approvalStage || approval.stage || 'Review'}</p>
                    <StatusBadge status="APPROVED" size="sm" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <span className="font-medium">Approver:</span> {approval.approvedBy || approval.approverName || approval.approver || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {approval.approverEmail || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Date:</span> {formatDate(approval.approvedAt || approval.timestamp || approval.date || approval.createdAt)}
                  </p>
                  {(approval.comments || approval.comment) && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 p-2 bg-white rounded">
                      <span className="font-medium">Comment:</span> {approval.comments || approval.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection History */}
        {(member.rejectionHistory && member.rejectionHistory.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
              Rejection History
            </h3>
            <div className="space-y-3">
              {member.rejectionHistory.map((rejection: any, index: number) => (
                <div key={index} className="border-l-4 border-red-500 pl-3 sm:pl-4 py-2 bg-red-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 capitalize">{rejection.approvalStage || rejection.stage || 'Review'}</p>
                    <StatusBadge status="REJECTED" size="sm" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <span className="font-medium">Rejected by:</span> {rejection.rejectedBy || rejection.approvedBy || rejection.approverName || rejection.actionBy || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {rejection.approverEmail || rejection.actionByEmail || rejection.rejectorEmail || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Date:</span> {formatDate(rejection.rejectedAt || rejection.approvedAt || rejection.timestamp || rejection.date || rejection.createdAt || rejection.actionAt)}
                  </p>
                  {(rejection.comments || rejection.comment || rejection.reason) && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 p-2 bg-white rounded">
                      <span className="font-medium">Reason:</span> {rejection.comments || rejection.comment || rejection.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval/Rejection Actions */}
        {canApprove() && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
              Review Application
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comments *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide your comments or feedback..."
                rows={4}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={actionLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading || !comment.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !comment.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Management for FINANCE role */}
        {canManagePayment() && (
          !member?.paymentLink
          || member.paymentStatus === 'failed'
          || !paymentDetails
          || paymentDetails?.isPaymentLinkExpired) && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
              Payment Management
            </h3>
            
            {/* <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://payment-link.com/..."
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={actionLoading}
                />
                <button
                  onClick={handleUpdatePaymentLink}
                  disabled={actionLoading || !paymentLink.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  {actionLoading ? 'Saving...' : 'Update Link'}
                </button>
              </div>
            </div> */}

            {/* {member.paymentLink && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Current Payment Link:</p>
                <a 
                  href={member.paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-xs sm:text-sm"
                >
                  {member.paymentLink}
                </a>
              </div>
            )} */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={generatePaymentLink}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                {actionLoading ? 'Processing...' : 'Generate Payment Link'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {member.paymentLink && member.paymentStatus && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2 mb-4">
              Payment Status
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-sm sm:text-base text-gray-700">
                Current Status:
              <StatusBadge status={getPaymentStatus().toUpperCase()} size="md" />
              </p>
              {canManagePayment() && getPaymentStatus() === 'pending' && (
                <button
                  onClick={checkPaymentStatus}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                >
                  {actionLoading ? 'Processing...' : 'Check Payment Status'}
                </button>
              )}
            </div>
            {member.paymentLink && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Payment Link:</p>
                <a 
                  href={member.paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-xs sm:text-sm"
                >
                  {member.paymentLink}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

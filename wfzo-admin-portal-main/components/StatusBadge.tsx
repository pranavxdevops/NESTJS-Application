import { MemberStatus, ApprovalStatus } from "@/lib/types/api";

interface StatusBadgeProps {
  status: MemberStatus | ApprovalStatus | string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  PAID: "bg-blue-100 text-blue-800 border-blue-200",
  pendingCommitteeApproval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pendingBoardApproval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pendingCEOApproval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approvedPendingPayment: "bg-orange-100 text-orange-800 border-orange-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  active: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  pendingCommitteeApproval: "Pending Committee",
  pendingBoardApproval: "Pending Board",
  pendingCEOApproval: "Pending CEO",
  approvedPendingPayment: "Pending Payment",
  approved: "Approved",
  active: "Active",
  rejected: "Rejected",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const baseClasses = "inline-flex items-center rounded-full font-semibold border";
  const colorClasses = statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = statusLabels[status] || status;

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {label}
    </span>
  );
}

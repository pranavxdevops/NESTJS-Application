import { cn } from "@/lib/utils/cn";

type StatusType =
  | "draft"
  | "pending"
  | "rejected"
  | "approved"
  | "published"
  | "past"
  | "registered"
  | "event"
  | "webinar"
  | "ongoing";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-wfzo-grey-400 bg-wfzo-grey-200 text-wfzo-grey-400"
  },
  pending: {
    label: "Pending review",
    className: "border-yellow-500 bg-yellow-50 text-yellow-500"
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500 bg-red-50 text-red-500"
  },
  approved: {
    label: "Approved",
    className: "border-green-500 bg-green-50 text-green-500"
  },
  published: {
    label: "Published",
    className: "border-blue-500 bg-blue-50 text-blue-500"
  },
  past: {
    label: "Past Event",
    className: "border-blue-500 bg-blue-50 text-blue-500"
  },
  registered: {
    label: "Registered",
    className: "border-green-500 bg-green-50 text-green-500"
  },
  event: {
    label: "Event",
    className: "border-blue-500 bg-blue-50 text-blue-500"
  },
  webinar: {
    label: "Webinar",
    className: "border-purple-500 bg-purple-50 text-purple-500"
  },
  ongoing: {
    label: "Ongoing",
    className: "border-wfzo-gold-600 bg-wfzo-gold-100 text-wfzo-gold-600"
  }
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border px-2 py-1",
        "text-xs font-normal leading-4 font-source cursor-pointer",
        config.className,
        className
      )}
    >
      {config.label}
    </div>
  );
}

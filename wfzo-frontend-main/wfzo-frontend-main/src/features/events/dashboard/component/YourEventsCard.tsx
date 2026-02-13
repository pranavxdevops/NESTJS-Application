import { cn } from "@/lib/utils/cn";
import GoldButton from "@/shared/components/GoldButton";
import StatusBadge from "./StatusBadge";

type EventStatus = "draft" | "pending" | "rejected" | "approved" | "published" | "registered" | "past" | "event" | "webinar" | "ongoing";

interface YourEventsCardProps {
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  status?: EventStatus;
  className?: string;
  onEdit?: () => void;
  buttonText?: string;
  onButtonClick?: () => void;
  onCardClick?: () => void; // Separate handler for card click
  showStatusBadge?: boolean;
}

const statusLabels: Record<EventStatus, string> = {
  draft: "Draft",
  pending: "Pending Review",
  rejected: "Rejected",
  approved: "Approved",
  published: "Published",
  registered: "Registered",
  past: "Past Events",
  event: "Event",
  webinar: "Webinar",
  ongoing: "Ongoing"
};

export default function YourEventsCard({
  title,
  organization,
  date,
  time,
  location,
  description,
  imageUrl,
  status,
  className,
  onEdit,
  buttonText = "Edit",
  onButtonClick,
  onCardClick, // New prop for card click
  showStatusBadge = false
}: YourEventsCardProps) {
  const hasImage = imageUrl && imageUrl.trim() !== "";

  const handleCardClick = () => {
    // Use onCardClick if provided, otherwise fall back to onButtonClick or onEdit
    if (onCardClick) {
      onCardClick();
    } else if (onButtonClick || onEdit) {
      (onButtonClick || onEdit)?.();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onButtonClick || onEdit) {
      (onButtonClick || onEdit)?.();
    }
  };
  const resolvedButtontext = status=== "published" || status=== "past" ? "Learn More" :buttonText

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-[20px] bg-white shadow-wfzo cursor-pointer hover:shadow-wfzo-hover transition-shadow",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image */}
      {hasImage ? (
        <div
          className="w-full h-[174px] rounded-xl bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <div className="w-full h-[174px] rounded-xl bg-wfzo-grey-400 flex-shrink-0" />
      )}

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1 h-[196px]">
          {/* Title with status */}
          <h3 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-800">
            <span className="text-wfzo-grey-800">{title} </span>
            {status === "draft" && !showStatusBadge && (
              <span className="font-normal text-wfzo-grey-500">
                ({statusLabels[status]})
              </span>
            )}
          </h3>

          {/* Organization */}
          <p className="font-source text-xs font-bold leading-4 text-wfzo-grey-800">
            {organization}
          </p>

          {/* Date */}
          <div className="flex items-center gap-1">
            <p className="font-source text-xl font-normal leading-6 text-wfzo-grey-800">
              {date}
            </p>
          </div>

          {/* Time */}
          {time && (
            <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-700">
              {time}
            </p>
          )}

          {/* Location */}
          {location && (
            <p className="font-source text-xs font-normal leading-4 text-wfzo-grey-700">
              {location}
            </p>
          )}

          {/* Status Badge */}
          {showStatusBadge && status && (
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700 line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
              {description}
            </p>
          )}
        </div>

        {/* Button */}
        {(onEdit || onButtonClick) && (
          <div>
              <GoldButton
            type="button"
            onClick={handleButtonClick}
            
          >
            {resolvedButtontext}
          </GoldButton>
          </div>
          
        )}
      </div>
    </div>
  );
}

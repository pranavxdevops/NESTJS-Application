import { cn } from "@/lib/utils/cn";
import GoldButton from "@/shared/components/GoldButton";

type WebinarStatus = "draft" | "pending" | "rejected" | "approved" | "published" | "past";

interface YourWebinarsCardProps {
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  status?: WebinarStatus;
  className?: string;
  buttonText?: string;
  onEdit?: () => void;
  onClick?: () => void;
}

const statusLabels: Record<WebinarStatus, string> = {
  draft: "Draft",
  pending: "Pending Review",
  rejected: "Rejected",
  approved: "Approved",
  published: "Published",
  past: "Past Webinars"
};

export default function YourWebinarsCard({
  title,
  organization,
  date,
  time,
  location,
  description,
  imageUrl,
  status,
  className,
  buttonText = "Edit",
  onEdit,
  onClick
}: YourWebinarsCardProps) {
  const hasImage = imageUrl && imageUrl.trim() !== "";
  const resolvedButtontext = status ==="published" || status==="past" ? "Learn More" : buttonText
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-[20px] bg-white shadow-wfzo cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      onClick={onClick}
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
            {status === "draft" && (
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

          {/* Description */}
          {description && (
            <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700 line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
              {description}
            </p>
          )}
        </div>

        {/* Edit Button */}
        <div>
        <GoldButton

          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking Edit button
            onEdit?.();
          }}
          
        >
          {resolvedButtontext}
        </GoldButton>

        </div>
      </div>
    </div>
  );
}
 
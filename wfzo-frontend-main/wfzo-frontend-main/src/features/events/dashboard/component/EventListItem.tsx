import { cn } from "@/lib/utils/cn";
import StatusBadge from "./StatusBadge";

interface EventListItemProps {
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  imageUrl?: string;
  status: "draft" | "pending" | "rejected" | "approved" | "published" | "past";
  hasNotification?: boolean;
  actionButton?: "publish" | "review";
  onActionClick?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function EventListItem({
  title,
  organization,
  date,
  time,
  location,
  imageUrl = "/public/assets/account.svg",
  status,
  hasNotification = false,
  actionButton,
  onActionClick,
  onClick,
  className
}: EventListItemProps) {
  return (
    <div className={cn("flex flex-col gap-3", onClick ? "cursor-pointer" : "", className)} onClick={onClick}>
      <div className="flex items-start gap-4">
        <div 
          className="w-15 h-15 rounded-xl flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-start gap-1">
            {hasNotification && (
              <div className="w-3 h-5 flex items-center justify-center pt-1">
                <div className="w-3 h-3 rounded-full bg-red-500 relative">
                  <div className="w-2 h-2 rounded-full bg-red-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
            <h4 className="font-source text-base font-bold leading-5 text-wfzo-grey-900 flex-1">
              {title}
            </h4>
          </div>
          
          <p className="font-source text-base font-normal leading-6 text-wfzo-grey-800">
            {date}
          </p>
          
          {time && (
            <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-600">
              {time}
            </p>
          )}
          
          <p className="font-source text-xs font-bold leading-4 text-wfzo-grey-800">
            {organization}
          </p>
          
          {location && (
            <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-700">
              {location}
            </p>
          )}
          <div>
          <StatusBadge status={status} />

          </div>
          
          {actionButton && (
            <button 
              type="button"
              onClick={onActionClick}
              className="font-source text-base font-bold leading-5 cursor-pointer
        text-wfzo-gold-600
        border-2 border-wfzo-gold-600
        w-[100px] h-[40px]
        rounded-[12px]
        py-2 px-6
        flex items-center justify-center gap-[10px]
        mr-auto"
            >
              Publish
            </button>
          )}
        </div>
      </div>
      
      {/* <div className="h-px bg-wfzo-gold-200" /> */}
    </div>
  );
}

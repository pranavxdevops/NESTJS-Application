import { cn } from "@/lib/utils/cn";
import StatusBadge from "./StatusBadge";
import GoldButton from "../../../../shared/components/GoldButton";
import LightButton from "../../../../shared/components/LightButton";

interface EventCardProps {
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  mode?: string;
  description?: string;
  imageUrl?: string;
  status?: readonly ("draft" | "pending" | "rejected" | "approved" | "published" | "registered" | "event" | "webinar" | "ongoing")[];
  countdown?: string;
  className?: string;
  onClick?: () => void;
  onLearnMore?: () => void;
  buttonLabel?: string;
  buttonVariant?: "join" | "learn-more";
}

export default function EventCard({
  title,
  organization,
  date,
  time,
  location,
  mode,
  description,
  imageUrl = "/public/assets/account.svg",
  status = [],
  countdown,
  className,
  onClick,
  onLearnMore,
  buttonLabel = "Learn more",
  buttonVariant = "learn-more"
}: EventCardProps) {
  const isJoinButton = buttonVariant === "join" || buttonLabel.toLowerCase().includes("join");

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-6 p-6 rounded-[20px] bg-white shadow-wfzo",
        className,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div
        className="w-full md:w-48 h-44 rounded-[12px] flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-3">
          <h3 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-800">
            {title}
          </h3>

          <p className="font-source text-sm font-bold leading-5 text-wfzo-grey-700">
            {organization}
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="font-source text-base font-normal leading-6 text-wfzo-grey-800">
                {date}{mode && ` (${mode})`}
              </p>
              {countdown && (
                <p className="font-source text-sm font-bold leading-5 text-wfzo-gold-600">
                  {countdown}
                </p>
              )}
            </div>

            {time && (
              <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-700">
                {time}
              </p>
            )}

            {location && (
              <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-700">
                {location}
              </p>
            )}
          </div>

          {status.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap pt-1">
              {status.map((s, idx) => (
                <StatusBadge key={idx} status={s} />
              ))}
            </div>
          )}

          {description && (
            <p className="font-source text-sm font-normal leading-6 text-wfzo-grey-600 line-clamp-3">
              {description}
            </p>
          )}
        </div>

        <div className="pt-2">
          {isJoinButton ? (
            <GoldButton
              type="button"
              onClick={onLearnMore}
              
            >
              {buttonLabel}
            </GoldButton>
          ) : (
            <LightButton
              onClick={onLearnMore}
              
            >
              {buttonLabel}
            </LightButton>
          )}
        </div>
      </div>
    </div>
  );
}

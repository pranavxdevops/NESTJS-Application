import React from "react";
import { CustomButton } from "./CustomButton";
import { ImageIcon } from "lucide-react";
import Image from "next/image";


interface EventCardProps {
  title: string;
  date: string;
  organization: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  onReadMore?: () => void;
}

export function EventCard({
  title,
  date,
  organization,
  location,
  description,
  imageUrl,
  className = "",
  onReadMore,
}: EventCardProps) {
  const baseClasses = [
    "bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300",
    "border border-transparent hover:border-gold-200",
    "flex flex-col",
  ].join(" ");

  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {/* Image placeholder */}
     <div className="h-44 w-full mb-4 bg-grey-300 rounded-xl flex items-center justify-center overflow-hidden relative">
  {imageUrl ? (
    <Image
      src={imageUrl}
      alt={title || "Card image"}
      fill
      className="object-cover object-top"
    />
  ) : (
    <ImageIcon className="w-12 h-12 text-grey-500" />
  )}
</div>

      {/* Content */}
      <div className="flex flex-col flex-grow gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-grey-800 font-heading font-bold text-xl leading-8">{title}</h3>
          <p className="text-grey-900 text-lg font-normal leading-6">{date}</p>
          <p className="text-grey-800 font-bold text-xs uppercase tracking-wide">{organization}</p>
          <p className="text-grey-700 text-xs">{location}</p>
          <p className="text-grey-700 text-base leading-6 line-clamp-3 flex-grow">{description}</p>
        </div>

        {/* Read more button */}
        <div className="mt-auto">
          <CustomButton type="button" size="sm" onClick={onReadMore} className="w-auto">
            Read more
          </CustomButton>
        </div>
      </div>
    </div>
  );
}

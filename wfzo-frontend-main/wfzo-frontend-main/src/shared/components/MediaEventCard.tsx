"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PlayCircle } from 'lucide-react';

interface MediaEventCardProps {
  title: string;
  organization: string;
  location: string;
  date: string;
  image: string;
  cardUrl?: string;      // Internal page link (e.g. /events/abc)
  videoUrl?: string;      // External YouTube link
  onImageClick?: () => void; // For photo/video modal (takes priority)
}

export default function MediaEventCard({
  title,
  organization,
  location,
  date,
  image,
  cardUrl,
  videoUrl,
  onImageClick,
}: MediaEventCardProps) {
  const router = useRouter();
  const hasModal = !!onImageClick;
  const isVideo = !!videoUrl;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Modal has highest priority (photo or video gallery)
    if (hasModal) {
      onImageClick();
      return;
    }

    // 2. Internal navigation (cardUrl)
    if (cardUrl?.startsWith('/')) {
      router.push(cardUrl);
      return;
    }

    // 3. External link (videoUrl or external cardUrl)
    const externalUrl = videoUrl || cardUrl;
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-white rounded-2xl shadow-[0_6px_8px_-6px_rgba(139,105,65,0.12),0_8px_16px_-6px_rgba(139,105,65,0.08)] transform transition-all duration-300 ease-in-out p-4 space-y-0 hover:shadow-xl hover:scale-[1.02]"
    >
      {/* Thumbnail */}
      <div className="relative h-[300px] rounded-xl overflow-hidden bg-gray-200">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Play Icon Overlay (only for videos when in modal mode) */}
        {isVideo && hasModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="w-20 h-20 text-white drop-shadow-2xl" />
          </div>
        )}

        {/* Optional: small video badge */}
        {isVideo && !hasModal && (
          <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            VIDEO
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-4 mt-4">
        <div className="space-y-1">
          <h3 className="text-base font-source font-bold text-wfzo-grey-900 leading-5 line-clamp-2 min-h-10">
            {title}
          </h3>

          <div className="text-sm font-source text-wfzo-grey-800 leading-5">
            {date}
          </div>

          <p className="text-xs font-source font-bold text-wfzo-grey-700 leading-4">
            {organization}
          </p>

          <p className="text-xs font-source text-wfzo-grey-700 leading-4">
            {location}
          </p>
        </div>
      </div>
    </div>
  );
}
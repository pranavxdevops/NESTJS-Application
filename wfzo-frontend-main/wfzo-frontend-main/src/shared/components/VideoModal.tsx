'use client';

import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export default function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  if (!isOpen || !videoUrl) return null;

  const youtubeId = videoUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
  )?.[1];

  if (!youtubeId) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center border border-wfzo-glass-stroke bg-wfzo-glass-fill backdrop-blur-glass shadow-glass p-4"
        onClick={onClose}
      >
        <div className="text-white text-lg">Invalid video URL</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-[1200px] rounded-xl bg-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center p-4 bg-white">
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#333333] hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col p-2">
          <div className="relative w-full aspect-[604/340]">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title="Video Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

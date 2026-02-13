
'use client';

import { Plus, Minus, X } from 'lucide-react';
import MediaEventCard from '@/shared/components/MediaEventCard';
import { useState } from 'react';

export interface VideoFAQItem {
  id: string;
  question: string;
  videos: { src: string; title?: string; thumbnail?: string }[];
  uniqueId: string;
  expanded?: boolean;
}

interface VideoFAQAccordionProps {
  items: VideoFAQItem[];
  className?: string;
  activeItemId: string | null;
  onToggle: (id: string) => void;
}

// Video Modal Component
function VideoModal({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const isYouTube = videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be');
  
  let embedUrl = videoUrl;
  if (isYouTube) {
    let videoId = '';
    try {
      let urlStr = videoUrl;
      if (!urlStr.startsWith('http')) {
        urlStr = 'https://' + urlStr;
      }
      const url = new URL(urlStr);
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
        videoId = url.searchParams.get('v') || '';
      }
    } catch (e) {
      console.error('Invalid YouTube URL:', videoUrl);
    }
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
        
        {isYouTube ? (
          <iframe
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full"
            title="Video player"
          />
        ) : (
          <video
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}

export function VideoFAQAccordion({ items = [], className = '', activeItemId, onToggle }: VideoFAQAccordionProps) {
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  const extractVideoThumbnail = (videoUrl: string): string => {
    const isYouTube = videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be');
    
    if (isYouTube) {
      let videoId = '';
      try {
        let urlStr = videoUrl;
        if (!urlStr.startsWith('http')) {
          urlStr = 'https://' + urlStr;
        }
        const url = new URL(urlStr);
        if (url.hostname === 'youtu.be') {
          videoId = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
          videoId = url.searchParams.get('v') || '';
        }
      } catch (e) {
        console.error('Invalid YouTube URL:', videoUrl);
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    // Fallback placeholder for non-YouTube videos
    return '/assets/video-placeholder.jpg';
  };

  return (
    <>
      <div className={`w-full font-source ${className}`}>
        {items.map((item) => {
          const isExpanded = activeItemId === item.uniqueId;
          return (
            <div key={item.uniqueId} className="w-full border-b border-gold-200 mt-5">
              <button
                onClick={() => onToggle(item.uniqueId)}
                className="flex w-full items-center justify-between px-4 md:px-8 py-4 md:py-6 text-left transition-colors hover:bg-gold-200/10 cursor-pointer"
              >
                <span className="flex-1 font-source text-sm md:text-base font-bold leading-5 text-gray-700 pr-4">
                  {item.question}
                </span>
                <div className="flex h-6 w-6 items-center justify-center">
                  {isExpanded ? (
                    <Minus className="h-6 w-6 text-neutral-grey-700" />
                  ) : (
                    <Plus className="h-6 w-6 text-neutral-grey-700" />
                  )}
                </div>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 md:px-8 pb-4 md:pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {item.videos.map((video, idx) => (
                      <MediaEventCard
                        key={idx}
                        title={video.title || `Video ${idx + 1}`}
                        organization="Ask an Expert"
                        location="Online"
                        date=""
                        image={video.thumbnail || extractVideoThumbnail(video.src)}
                        videoUrl={video.src}
                        onImageClick={() => setModalVideoUrl(video.src)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      {modalVideoUrl && (
        <VideoModal videoUrl={modalVideoUrl} onClose={() => setModalVideoUrl(null)} />
      )}
    </>
  );
}

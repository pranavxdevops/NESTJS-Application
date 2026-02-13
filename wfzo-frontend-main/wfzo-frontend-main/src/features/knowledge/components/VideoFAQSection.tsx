'use client';

import { VideoFAQAccordion } from './VideoFAQAccordion';

interface VideoFAQSectionProps {
  title: string;
  items: { question: string; videos: { src: string; title?: string }[]; id: string; uniqueId: string }[];
  className?: string;
  activeItemId: string | null;
  onToggle: (id: string) => void;
}

export default function VideoFAQSection({ title, items = [], className = '', activeItemId, onToggle }: VideoFAQSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="font-montserrat text-2xl lg:text-3xl font-black leading-tight text-neutral-grey-900">
        {title}
      </h2>
      <VideoFAQAccordion items={items} activeItemId={activeItemId} onToggle={onToggle} />
    </div>
  );
}
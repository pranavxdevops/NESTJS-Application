
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface YourEventsSectionProps {
  locale: string;
  event?: any;
}

export default function YourEventsSection({ locale, event }: YourEventsSectionProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const events = event ? [event] : [];

  // ✅ SAME BEHAVIOR AS YourPublicationsSection
  if (events.length === 0) return null;

  const latestEvent = events[0];
  console.log('Latest Event:', latestEvent);

  function getImageUrl(im: any): string | import("next/dist/shared/lib/get-img-props").StaticImport {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="rounded-[20px] border border-wfzo-gold-200 bg-[#F8F5F1] p-8">
      {/* Header */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-4 max-w-3xl">
          <h2 className="text-wfzo-grey-900 font-montserrat text-xl font-semibold">
            Your Events
          </h2>
          <p className="text-wfzo-grey-700 font-source text-base leading-6">
            Create, manage, and track events hosted by your organization. Keep your audience informed and engaged with upcoming and past events.
          </p>
        </div>

        <ChevronRight
          className={`mt-1 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-8">
          <div className="flex gap-6 rounded-[20px] bg-white p-6 shadow-wfzo">
            {/* Image */}
            <div className="relative h-40 w-40 overflow-hidden rounded-xl flex-shrink-0">
              {latestEvent?.imageUrl && (
                <Image
                  src={latestEvent.imageUrl}
                  alt={latestEvent.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 flex-1">
              <h3 className="text-wfzo-grey-800 font-montserrat text-2xl font-extrabold">
                {latestEvent.title}
              </h3>

              <p className="text-wfzo-grey-800 font-source text-xs font-bold">
                {latestEvent.organization}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-wfzo-grey-800 font-source text-xl">
                  {latestEvent.date} ({latestEvent.eventData.eventType})
                </span>
                <span className="text-wfzo-gold-600 font-source text-base font-bold">
                  {latestEvent.duration}
                </span>
              </div>

              <p className="text-wfzo-grey-700 text-sm">
                {latestEvent.time}
              </p>
              <p className="text-wfzo-grey-700 text-sm">
                {latestEvent.location}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/${locale}/events/your-events`)}
            className="mt-6 text-wfzo-gold-600 font-source text-base font-semibold hover:underline cursor-pointer"
          >
            View Your Events
          </button>
        </div>
      )}
    </div>
  );
}

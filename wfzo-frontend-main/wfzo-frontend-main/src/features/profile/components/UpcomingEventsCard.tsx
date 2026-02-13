'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UpcomingEventsCardProps {
  locale: string;
  event?: any;
  isPrimary?: boolean;
}

export default function UpcomingEventsCard({ locale, event, isPrimary }: UpcomingEventsCardProps) {
  const router = useRouter();

  // Normalize to array and ensure we have events
  const events = event ? [event] : [];

  if (events.length === 0) return null;

  return (
    <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#F8F5F1]">
      <div className="flex flex-col gap-4">
        <h3 className="text-wfzo-grey-900 font-source text-xl font-normal leading-6">
          Upcoming Registered Events
        </h3>

        <div className="flex flex-col gap-4">
          {events.map((event, index) => (
            <div
              key={event.slug || event.documentId || event.id || `event-${index}`}
              className="flex flex-col gap-3"
            >
              <div className="flex gap-4">
                <div className="w-[60px] h-[60px] rounded-xl bg-gray-200 relative overflow-hidden flex-shrink-0">
                  {event.image && (
                    <Image
                      src={event.image}
                      alt={event.title || 'Event image'}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-wfzo-grey-800 font-source text-base font-bold leading-5">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                        {event.date}
                      </span>
                      {event.time && (
                        <span className="text-wfzo-gold-600 font-source text-base font-bold leading-5">
                          {event.time}
                        </span>
                      )}
                    </div>
                    <p className="text-wfzo-grey-800 font-source text-xs font-bold leading-4">
                      {event.organizer}
                    </p>
                      {!isPrimary && (
                    <div className="flex px-2 py-1 items-center gap-0.5 rounded-xl border border-purple-500 bg-purple-50 w-fit">
                      <span className="text-purple-500 font-source text-xs font-normal leading-4">
                        {event.type || 'Event'}
                      </span>
                    </div>
                      )}
                  </div>
                      {!isPrimary && (
                  <button
                    onClick={() => router.push(`/${locale}/events/${event.slug || event.id}/join`)}
                    className="flex flex-col p-px rounded-xl bg-wfzo-gold-700"
                  >
                    <div className="flex px-6 py-[7px] justify-center items-center gap-2 rounded-[11px] border-t border-r border-l border-wfzo-gold-500 bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500">
                      <span className="text-white font-source text-base font-semibold leading-6">
                        Join {event.type || 'Event'}
                      </span>
                    </div>
                  </button>
                      )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(`/${locale}/events/all-events`)}
          className="self-start px-6 py-2 rounded-xl bg-wfzo-gold-50 text-wfzo-gold-600 font-source text-base font-semibold hover:bg-wfzo-gold-100 transition-colors cursor-pointer"
        >
          View all
        </button>
      </div>
    </div>
  );
}
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/shared/components/Breadcrumb";
import YourEventsTabs, { YourEvent } from "@/features/events/dashboard/component/YourEventsTabs";
import { useEffect, useState } from "react";
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { strapi } from "@/lib/strapi";

import AdvertiseEventModal, { EventData } from '@/features/events/dashboard/component/AdvertiseEventModal';
import { useAuth } from "@/lib/auth/useAuth";
import HeroAuth from "@/features/events/dashboard/component/HeroAuth";
import Link from "next/link";

type EventStatus = 'initial' | 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'past';


export default function YourEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<YourEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<EventStatus>('past');
  const [currentEventId, setCurrentEventId] = useState<string | number | null>(null);
  const [currentEventData, setCurrentEventData] = useState<EventData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, member } = useAuth();

  function formatEventDate(start?: string | null, end?: string | null) {
    if (!start) return '';
    try {
      const s = new Date(start);
      if (end) {
        const e = new Date(end);
        if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
          const dayStart = s.getDate();
          const dayEnd = e.getDate();
          const month = s.toLocaleString(undefined, { month: 'short' });
          return `${dayStart}-${dayEnd} ${month}, ${s.getFullYear()}`;
        }
        return s.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return s.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  useEffect(() => {
    if (!member?.organisationInfo?.companyName) return;
    async function fetchEvents() {
      try {
        const params = new URLSearchParams(window.location.search);
        const orgName = member?.organisationInfo?.companyName;

        // Fetch hosted events using the strapi utility
        const allRawEvents = await strapi.eventApi.fetchHostedEvents(orgName);

        console.log('Hosted events:', allRawEvents);

        // Remove duplicates by documentId if any (though unlikely with single endpoint)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueEvents = allRawEvents.filter((event, index, self) =>
          index ===
          self.findIndex((e) =>
            (e.documentId || e.attributes?.documentId) ===
            (event.documentId || event.attributes?.documentId)
          )
        );

        // Events are already sorted by startDateTime ascending from the API

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized: YourEvent[] = uniqueEvents.map((ev: any) => {
          const imageUrl = ev?.image?.image?.url
            ? getStrapiMediaUrl(ev.image.image.url)
            : ev?.image?.url
              ? getStrapiMediaUrl(ev.image.url)
              : '';

          const title = ev?.title || ev?.attributes?.title || '';
          const organization = ev?.organizer || ev?.attributes?.organizer || orgName;
          const start = ev?.startDateTime || ev?.attributes?.startDateTime || null;
          const end = ev?.endDateTime || ev?.attributes?.endDateTime || null;
          const dateStr = formatEventDate(start, end);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let status = (ev?.eventStatus ||
            ev?.attributes?.status) as YourEvent['status'];
          if (!status) {
            status = 'draft';
          }
          status = status.toLowerCase() as YourEvent['status'];

          // Check if past event
          let isPast = false;
          if (end && new Date(end) < new Date()) {
            isPast = true;
          }

          if (isPast) {
            status = 'past';
          }

          return {
            id: String(ev?.documentId || ev?.attributes?.documentId || ev?.id || Math.random()),
            title,
            organization,
            date: dateStr,
            time: '',
            location: ev?.location || ev?.attributes?.location || '',
            description: ev?.shortDescription || ev?.attributes?.shortDescription || '',
            imageUrl,
            slug: ev?.slug || ev?.attributes?.slug || '',
            eventData: ev,
            status,
          } as YourEvent;
        });

        setEvents(normalized);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [member,refreshTrigger]);

  const handleOpenAdvertiseModal = (
    status: EventStatus,
    eventId?: string | number,
    eventData?: EventData | null,
  ) => {
    setCurrentStatus(status);
    setCurrentEventId(eventId || null);
    setCurrentEventData(eventData || null);
    setIsFormModalOpen(true);
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Events", href: "/events/dashboard", isHome: false },
    { label: "Your Events", isCurrent: true }
  ];

  return (
    <>
      <div className="min-h-screen bg-wfzo-gold-25">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>
        
        <div className="px-5 md:px-30 py-10">
          {/* Back Button */}
          <Link 
          href="/events/dashboard"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
              Your Events
            </h1>
          </div>

          {/* Tabs and Events */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-wfzo-grey-600 text-lg">Loading events...</p>
            </div>
          ) : (
            <YourEventsTabs events={events} onOpenModal={handleOpenAdvertiseModal} />
          )}
        </div>
      </div>

      <AdvertiseEventModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        status={currentStatus || 'past'}
        eventId={currentEventId}
        eventData={currentEventData}
        mode="event"
        onSave={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
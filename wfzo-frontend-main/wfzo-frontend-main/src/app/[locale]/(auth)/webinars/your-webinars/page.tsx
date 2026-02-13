"use client";

import React, { useEffect, useState } from "react";

import AdvertiseEventModal, { EventData } from '@/features/events/dashboard/component/AdvertiseEventModal';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/shared/components/Breadcrumb";
import WebinarsTabs, { YourWebinar } from "@/features/events/dashboard/component/WebinarTabs";
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { strapi } from '@/lib/strapi';
import { useAuth } from "@/lib/auth/useAuth";
import HeroAuth from "@/features/events/dashboard/component/HeroAuth";
import Link from "next/link";

type WebinarStatus = 'initial' | 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'past';



export default function YourWebinarsPage() {
  const router = useRouter();
  const [webinars, setWebinars] = useState<YourWebinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<WebinarStatus>('past');
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
    async function fetchWebinars() {
      try {
        const params = new URLSearchParams(window.location.search);
        const orgName = member?.organisationInfo?.companyName;

        // Fetch hosted webinars using the strapi utility
        const allRawWebinars = await strapi.webinarApi.fetchHostedWebinars(orgName);

        console.log('Hosted webinars:', allRawWebinars);

        // Remove duplicates by documentId if any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueWebinars = allRawWebinars.filter((webinar, index, self) =>
          index ===
          self.findIndex((w) =>
            (w.documentId || w.attributes?.documentId) ===
            (webinar.documentId || webinar.attributes?.documentId)
          )
        );

        // Webinars are already sorted by startDate ascending from the API

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized: YourWebinar[] = uniqueWebinars.map((web: any) => {
          const imageUrl = web?.image?.image?.url
            ? getStrapiMediaUrl(web.image.image.url)
            : web?.image?.url
              ? getStrapiMediaUrl(web.image.url)
              : '';

          const title = web?.title || web?.attributes?.title || '';
          const organization = web?.organizer || web?.attributes?.organizer || orgName;
          const start = web?.startDate || web?.attributes?.startDate || null;
          const dateStr = formatEventDate(start, null); // Webinars have single date

          // Check if past webinar
          let isPast = false;
          if (start && new Date(start) < new Date()) {
            isPast = true;
          }

          let status = (web?.webinarStatus ||
            web?.attributes?.webinarStatus) as YourWebinar['status'];
          if (!status) {
            status = 'draft';
          }
          status = status.toLowerCase() as YourWebinar['status'];

          if (isPast) {
            status = 'past';
          }

          return {
            id: String(web?.documentId || web?.attributes?.documentId || web?.id || Math.random()),
            title,
            organization,
            date: dateStr,
            time: '',
            location: web?.location || web?.attributes?.location || 'Online',
            description: web?.shortDescription || web?.attributes?.shortDescription || '',
            imageUrl,
            slug: web?.slug || web?.attributes?.slug || '',
            eventData: web,
            status,
          } as YourWebinar;
        });

        setWebinars(normalized);
      } catch (error) {
        console.error('Error loading webinars:', error);
      } finally {
        setLoading(false);
      }
    }
fetchWebinars();
}, [member,refreshTrigger]);

const handleOpenAdvertiseModal = (
  status: WebinarStatus,
  eventId?: string | number,
  eventData?: unknown,
) => {
  setCurrentStatus(status);
  setCurrentEventId(eventId || null);
  setCurrentEventData(eventData || null);
  setIsFormModalOpen(true);
};

const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Webinars", href: "/events/dashboard", isHome: false },
    { label: "Your Webinars", isCurrent: true }
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
              Your Webinars
            </h1>
          </div>

          {/* Tabs and Webinars */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-wfzo-grey-600 text-lg">Loading webinars...</p>
            </div>
          ) : (
            <WebinarsTabs webinars={webinars} onOpenModal={handleOpenAdvertiseModal} />
          )}
        </div>
      </div>

      <AdvertiseEventModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        status={currentStatus || 'past'}
        eventId={currentEventId}
        eventData={currentEventData}
        mode="webinar"
        onSave={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
 
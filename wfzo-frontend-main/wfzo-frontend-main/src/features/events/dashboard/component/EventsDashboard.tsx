"use client";
import AdvertiseEventModal from "@/features/events/dashboard/component/AdvertiseEventModal";
import CreateEventWebinarModal from "@/features/events/dashboard/component/CreateEventWebinarModal";
import EventListItem from "@/features/events/dashboard/component/EventListItem";
import SidebarSection from "@/features/events/dashboard/component/SidebarSection";
import EventCard from "@/features/events/dashboard/component/EventCard";
import GoldButton from "@/shared/components/GoldButton";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import Link from "next/link";
const mockRegisteredEvents = [
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025 (Hybrid)",
    time: "4:00 - 5:00 PM (GMT +4)",
    location: "Hainan, China",
    status: ["event", "registered", "ongoing"] as const,
    countdown: "Ongoing",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Join Event",
    buttonVariant: "join" as const
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: ["webinar", "registered"] as const,
    countdown: "12D : 13H : 52M",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Join Webinar",
    buttonVariant: "join" as const
  }
];

const mockUpcomingEvents = [
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025 (Presential)",
    location: "Hainan, China",
    status: ["registered"] as const,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor.",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Learn more",
    buttonVariant: "learn-more" as const
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025 (Hybrid)",
    location: "Hainan, China",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor.",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Learn more",
    buttonVariant: "learn-more" as const
  }
];

const mockUpcomingWebinars = [
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor.",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Learn more",
    buttonVariant: "learn-more" as const
  },
  {
    title: "9th Abu Dhabi Airshow",
    organization: "Abu Dhabi Airports",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor.",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Learn more",
    buttonVariant: "learn-more" as const
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025 (Online)",
    time: "4:00 - 5:00 PM (GMT +4)",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor.",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800",
    buttonLabel: "Learn more",
    buttonVariant: "learn-more" as const
  }
];

interface HostingEvent {
  title: string;
  organization: string;
  date: string;
  location: string;
  status: "draft" | "pending" | "rejected" | "approved" | "published" | "past";
  imageUrl: string;
  hasNotification?: boolean;
  actionButton?: "publish" | "review";
}

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

const mockHostingWebinars = [
  {
    title: "Sirjan Special Economic Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: "draft" as const,
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800"
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: "pending" as const,
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800"
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: "rejected" as const,
    hasNotification: true,
    actionButton: "review" as const,
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800"
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: "approved" as const,
    hasNotification: true,
    actionButton: "publish" as const,
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800"
  },
  {
    title: "11th World FZO World Congress",
    organization: "World Free Zones Organization",
    date: "10-12 Oct, 2025",
    time: "4:00 - 5:00 PM (GMT +4)",
    status: "published" as const,
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800"
  }
];

type EventStatus = 'initial' |'draft' | 'pending' | 'rejected' | 'approved';

export default function DashboardPage() {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<EventStatus>('draft');
  const [hostingEvents, setHostingEvents] = useState<HostingEvent[]>([]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectEvent = () => {
    setIsFormModalOpen(true);
    setCurrentStatus('pending');
    console.log("Advertise Event selected");
  };

  const handleSelectWebinar = () => {
    console.log("Post Webinar selected");
  };

  useEffect(() => {
    async function fetchHostingEvents() {
      try {
        const orgName = 'World Free Zones Organization';

        // Fetch drafts/unpublished via existing proxy (your-events endpoint)
        const draftUrl = `/api/events/your-events?organization=${encodeURIComponent(orgName)}`;
        const draftRes = await fetch(draftUrl, { cache: 'no-store' });
        let draftJson = { data: [] };
        if (draftRes.ok) {
          draftJson = await draftRes.json();
        }

        // Fetch published via new proxy endpoint
        const publishedUrl = `/api/events/hosting-published?organization=${encodeURIComponent(orgName)}`;
        const publishedRes = await fetch(publishedUrl, { cache: 'no-store' });
        let publishedJson = { data: [] };
        if (publishedRes.ok) {
          publishedJson = await publishedRes.json();
        }

        console.log('Drafts:', draftJson);
        console.log('Published:', publishedJson);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const draftEvents: any[] = Array.isArray(draftJson?.data) ? draftJson.data : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const publishedEvents: any[] = Array.isArray(publishedJson?.data) ? publishedJson.data : [];

        const allRawEvents = [...draftEvents, ...publishedEvents];

        // Remove duplicates by documentId if any
        const uniqueEvents = allRawEvents.filter((event, index, self) =>
          index === self.findIndex(e => (e.documentId || e.attributes?.documentId) === (event.documentId || event.attributes?.documentId))
        );

        // Sort by start date descending (latest first)
        uniqueEvents.sort((a, b) => {
          const startA = new Date(a?.startDateTime || a?.attributes?.startDateTime || 0);
          const startB = new Date(b?.startDateTime || b?.attributes?.startDateTime || 0);
          return startB.getTime() - startA.getTime();
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized: HostingEvent[] = uniqueEvents.map((ev: any) => {
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

          // Check if past event
          let isPast = false;
          if (end && new Date(end) < new Date()) {
            isPast = true;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let status = ((ev as any)?.eventStatus || (ev as any)?.attributes?.status) as HostingEvent['status'];
          if (!status) {
            console.log("no status")
            status = 'draft';
          }
          status = status.toLowerCase() as HostingEvent['status'];

          if (isPast) {
            status = 'past';
          }

          const hasNotification = status === 'rejected' || status === 'approved';
          const actionButton = status === 'approved' ? 'publish' : status === 'rejected' ? 'review' : undefined;

          return {
            title,
            organization,
            date: dateStr,
            location: ev?.location || ev?.attributes?.location || '',
            status,
            imageUrl,
            ...(hasNotification && { hasNotification }),
            ...(actionButton && { actionButton }),
          };
        });

        setHostingEvents(normalized);
      } catch (error) {
        console.error('Error loading hosting events:', error);
      }
    }

    fetchHostingEvents();
  }, []);

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      
      {/* Hero Section */}
      <div 
        className="w-full h-[248px] bg-cover bg-center"
        style={{ 
          backgroundImage: "url(https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880)" 
        }}
      />
      
      <div className="container mx-auto px-4 lg:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button className="flex items-center gap-4 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24.1667 30C23 30 22.0139 29.5972 21.2083 28.7917C20.4028 27.9861 20 27 20 25.8333C20 24.6667 20.4028 23.6806 21.2083 22.875C22.0139 22.0695 23 21.6667 24.1667 21.6667C25.3333 21.6667 26.3194 22.0695 27.125 22.875C27.9306 23.6806 28.3333 24.6667 28.3333 25.8333C28.3333 27 27.9306 27.9861 27.125 28.7917C26.3194 29.5972 25.3333 30 24.1667 30ZM8.33333 36.6667C7.41667 36.6667 6.63194 36.3403 5.97917 35.6875C5.32639 35.0347 5 34.25 5 33.3333V10C5 9.08334 5.32639 8.29862 5.97917 7.64584C6.63194 6.99307 7.41667 6.66668 8.33333 6.66668H10V5.00001C10 4.52779 10.1597 4.13195 10.4792 3.81251C10.7986 3.49307 11.1944 3.33334 11.6667 3.33334C12.1389 3.33334 12.5347 3.49307 12.8542 3.81251C13.1736 4.13195 13.3333 4.52779 13.3333 5.00001V6.66668H26.6667V5.00001C26.6667 4.52779 26.8264 4.13195 27.1458 3.81251C27.4653 3.49307 27.8611 3.33334 28.3333 3.33334C28.8056 3.33334 29.2014 3.49307 29.5208 3.81251C29.8403 4.13195 30 4.52779 30 5.00001V6.66668H31.6667C32.5833 6.66668 33.3681 6.99307 34.0208 7.64584C34.6736 8.29862 35 9.08334 35 10V33.3333C35 34.25 34.6736 35.0347 34.0208 35.6875C33.3681 36.3403 32.5833 36.6667 31.6667 36.6667H8.33333ZM8.33333 33.3333H31.6667V16.6667H8.33333V33.3333ZM8.33333 13.3333H31.6667V10H8.33333V13.3333Z" fill="#8B6941"/>
                </svg>
                <span className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                  View All Events
                </span>
              </button>
              
              <button className="flex items-center gap-4 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M35 33.8142V8.42957C35 8.27985 34.9519 8.15694 34.8558 8.06082C34.7597 7.96471 34.6368 7.91666 34.4871 7.91666H5.51292C5.36319 7.91666 5.24028 7.96471 5.14417 8.06082C5.04806 8.15694 5 8.27985 5 8.42957V20C5 20.3542 4.88014 20.651 4.64042 20.8904C4.40069 21.1301 4.10375 21.25 3.74958 21.25C3.39514 21.25 3.09833 21.1301 2.85917 20.8904C2.61972 20.651 2.5 20.3542 2.5 20V8.42957C2.5 7.60096 2.795 6.89166 3.385 6.30166C3.975 5.71166 4.68431 5.41666 5.51292 5.41666H34.4871C35.3157 5.41666 36.025 5.71166 36.615 6.30166C37.205 6.89166 37.5 7.60096 37.5 8.42957V31.0096C37.5 31.734 37.259 32.3637 36.7771 32.8987C36.2954 33.434 35.7031 33.7392 35 33.8142ZM15 22.8204C13.3958 22.8204 12.0226 22.2493 10.8804 21.1071C9.73792 19.9646 9.16667 18.5912 9.16667 16.9871C9.16667 15.3829 9.73792 14.0097 10.8804 12.8675C12.0226 11.725 13.3958 11.1537 15 11.1537C16.6042 11.1537 17.9774 11.725 19.1196 12.8675C20.2621 14.0097 20.8333 15.3829 20.8333 16.9871C20.8333 18.5912 20.2621 19.9646 19.1196 21.1071C17.9774 22.2493 16.6042 22.8204 15 22.8204ZM13 6.25V17.75C13 18.1 13.1208 18.3958 13.3625 18.6375C13.6042 18.8792 13.9 19 14.25 19C14.5833 19 14.8708 18.8667 15.1125 18.6C15.3542 18.3333 15.4833 18.0333 15.5 17.7C15.15 17.5667 14.8292 17.3875 14.5375 17.1625C14.2458 16.9375 13.9833 16.6667 13.75 16.35C13.5833 16.1167 13.5208 15.8667 13.5625 15.6C13.6042 15.3333 13.7417 15.1167 13.975 14.95C14.2083 14.7833 14.4583 14.7208 14.725 14.7625C14.9917 14.8042 15.2083 14.9417 15.375 15.175C15.5583 15.4417 15.7917 15.6458 16.075 15.7875C16.3583 15.9292 16.6667 16 17 16C17.55 16 18.0208 15.8042 18.4125 15.4125C18.8042 15.0208 19 14.55 19 14C19 13.9167 18.9958 13.8333 18.9875 13.75C18.9792 13.6667 18.9583 13.5833 18.925 13.5C18.6417 13.6667 18.3375 13.7917 18.0125 13.875C17.6875 13.9583 17.35 14 17 14C16.7167 14 16.4792 13.9042 16.2875 13.7125C16.0958 13.5208 16 13.2833 16 13C16 12.7167 16.0958 12.4792 16.2875 12.2875C16.4792 12.0958 16.7167 12 17 12C17.55 12 18.0208 11.8042 18.4125 11.4125C18.8042 11.0208 19 10.55 19 10C19 9.45 18.8042 8.98333 18.4125 8.6C18.0208 8.21667 17.55 8.01667 17 8C16.8167 8.3 16.5792 8.5625 16.2875 8.7875C15.9958 9.0125 15.675 9.19167 15.325 9.325C15.0583 9.425 14.8 9.41667 14.55 9.3C14.3 9.18333 14.1333 8.99167 14.05 8.725C13.9667 8.45833 13.9792 8.2 14.0875 7.95C14.1958 7.7 14.3833 7.53333 14.65 7.45C14.9 7.36667 15.1042 7.21667 15.2625 7C15.4208 6.78333 15.5 6.53333 15.5 6.25C15.5 5.9 15.3792 5.60417 15.1375 5.3625C14.8958 5.12083 14.6 5 14.25 5C13.9 5 13.6042 5.12083 13.3625 5.3625C13.1208 5.60417 13 5.9 13 6.25ZM11 17.75V6.25C11 5.9 10.8792 5.60417 10.6375 5.3625C10.3958 5.12083 10.1 5 9.75 5C9.4 5 9.10417 5.12083 8.8625 5.3625C8.62083 5.60417 8.5 5.9 8.5 6.25C8.5 6.51667 8.575 6.7625 8.725 6.9875C8.875 7.2125 9.075 7.36667 9.325 7.45C9.59167 7.53333 9.78333 7.7 9.9 7.95C10.0167 8.2 10.0333 8.45833 9.95 8.725C9.85 8.99167 9.675 9.18333 9.425 9.3C9.175 9.41667 8.91667 9.425 8.65 9.325C8.3 9.19167 7.97917 9.0125 7.6875 8.7875C7.39583 8.5625 7.15833 8.3 6.975 8C6.44167 8.01667 5.97917 8.22083 5.5875 8.6125C5.19583 9.00417 5 9.46667 5 10C5 10.55 5.19583 11.0208 5.5875 11.4125C5.97917 11.8042 6.45 12 7 12C7.28333 12 7.52083 12.0958 7.7125 12.2875C7.90417 12.4792 8 12.7167 8 13C8 13.2833 7.90417 13.5208 7.7125 13.7125C7.52083 13.9042 7.28333 14 7 14C6.65 14 6.3125 13.9583 5.9875 13.875C5.6625 13.7917 5.35833 13.6667 5.075 13.5C5.04167 13.5833 5.02083 13.6667 5.0125 13.75C5.00417 13.8333 5 13.9167 5 14C5 14.55 5.19583 15.0208 5.5875 15.4125C5.97917 15.8042 6.45 16 7 16C7.33333 16 7.64167 15.9292 7.925 15.7875C8.20833 15.6458 8.44167 15.4417 8.625 15.175C8.79167 14.9417 9.00833 14.8042 9.275 14.7625C9.54167 14.7208 9.79167 14.7833 10.025 14.95C10.2583 15.1167 10.3958 15.3333 10.4375 15.6C10.4792 15.8667 10.4167 16.1167 10.25 16.35C10.0167 16.6667 9.75 16.9417 9.45 17.175C9.15 17.4083 8.825 17.5917 8.475 17.725C8.49167 18.0583 8.625 18.3542 8.875 18.6125C9.125 18.8708 9.41667 19 9.75 19C10.1 19 10.3958 18.8792 10.6375 18.6375C10.8792 18.3958 11 18.1 11 17.75Z" fill="#8B6941"/>
                </svg>
                <span className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                  View All Webinars
                </span>
              </button>
            </div>
            
            {/* Registered Events & Webinars */}
            <section className="flex flex-col gap-6">
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Registered Events & Webinars
              </h2>
              
              <div className="flex flex-col gap-6">
                {mockRegisteredEvents.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
            
            {/* Upcoming Events */}
            <section className="flex flex-col gap-6">
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Upcoming Events
              </h2>
              
              <div className="flex flex-col gap-6">
                {mockUpcomingEvents.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
            
            {/* Upcoming Webinars */}
            <section className="flex flex-col gap-6">
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Upcoming Webinars
              </h2>
              
              <div className="flex flex-col gap-6">
                {mockUpcomingWebinars.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
          </div>
          
          {/* Sidebar - Right Column */}
          <div className="flex flex-col gap-6">
            {/* Create Event/Webinar */}
            <SidebarSection
              className="flex-row items-center cursor-pointer hover:bg-wfzo-gold-100 transition-colors"
              onClick={handleOpenModal}
            >
              <GoldButton
              >
                  <PlusIcon className="w-6 h-6" />
              </GoldButton>
              <h3 className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                Create an Event or Webinar
              </h3>
            </SidebarSection>
            
            {/* Events You're Hosting */}
            <SidebarSection
              title={`Events You're Hosting (${hostingEvents.length})`}
              action={
                <Link href="/events/your-events">
                <GoldButton className="w-full">
                  View all
                </GoldButton>
                </Link>
              }
            >
              {hostingEvents.map((event, idx) => (
                <EventListItem key={idx} {...event} />
              ))}
            </SidebarSection>
            
            {/* Webinars You're Hosting */}
            <SidebarSection 
              title="Webinars You're Hosting (5)"
              action={
                <GoldButton>
                  View all
                </GoldButton>
              }
            >
              {mockHostingWebinars.map((event, idx) => (
                <EventListItem key={idx} {...event} />
              ))}
            </SidebarSection>
          </div>
        </div>
      </div>

      <CreateEventWebinarModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectEvent={handleSelectEvent}
        onSelectWebinar={handleSelectWebinar}
      />

      <AdvertiseEventModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        status={currentStatus}
      />
    </div>
  );
}

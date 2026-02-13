'use client';
import { EventData } from '@/features/events/dashboard/component/AdvertiseEventModal';
import AdvertiseEventModal from '@/features/events/dashboard/component/AdvertiseEventModal';
import CreateEventWebinarModal from '@/features/events/dashboard/component/CreateEventWebinarModal';
import EventListItem from '@/features/events/dashboard/component/EventListItem';
import SidebarSection from '@/features/events/dashboard/component/SidebarSection';
import EventCard from '@/features/events/dashboard/component/EventCard';
import EventCardSkeleton from '@/features/events/dashboard/component/EventCardSkeleton';
import GoldButton from '@/shared/components/GoldButton';
import { PlusIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { STRAPI_URL, strapi } from '@/lib/strapi';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Link from "next/link";
import GoldButtonChevron from '@/shared/components/GoldButtonChevron';
import { useAuth } from '@/lib/auth/useAuth';
import SidebarSkeleton from '@/features/events/dashboard/component/SidebarSkeleton';
import IncompleteProfileBanner from '@/features/profile/components/IncompleteProfileBanner';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import DraftSavedBanner from '@/features/events/dashboard/component/DraftSavedBanner';
const mockRegisteredEvents = [
  {
    title: '11th World FZO World Congress',
    organization: 'World Free Zones Organization',
    date: '10-12 Oct, 2025 (Hybrid)',
    time: '4:00 - 5:00 PM (GMT +4)',
    location: 'Hainan, China',
    status: ['event', 'registered', 'ongoing'] as const,
    countdown: 'Ongoing',
    imageUrl:
      'https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800',
    buttonLabel: 'Join Event',
    buttonVariant: 'join' as const,
  },
  {
    title: '11th World FZO World Congress',
    organization: 'World Free Zones Organization',
    date: '10-12 Oct, 2025',
    time: '4:00 - 5:00 PM (GMT +4)',
    status: ['webinar', 'registered'] as const,
    countdown: '12D : 13H : 52M',
    imageUrl:
      'https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800',
    buttonLabel: 'Join Webinar',
    buttonVariant: 'join' as const,
  },
];


interface StrapiEventData {
  title?: string;
  organizer?: string;
  slug?: string;
  eventType?: string;
  attributes?: {
    title?: string;
    organizer?: string;
    slug?: string;
    eventType?: string;
  };
}

interface HostingEvent {
  id?: string | number;
  title: string;
  organization: string;
  date: string;
  location: string;
  status: 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'past';
  imageUrl: string;
  hasNotification?: boolean;
  actionButton?: 'publish' | 'review';
  eventData?: StrapiEventData;
}

interface UpcomingEvent {
  title: string;
  organization: string;
  date: string;
  location: string;
  slug: string;
  status?: readonly ("event" | "pending" | "draft" | "rejected" | "approved" | "published" | "registered" | "webinar" | "ongoing")[];
  description: string;
  imageUrl: string;
  buttonLabel: string;
  buttonVariant: 'learn-more';
}

interface UpcomingWebinar extends UpcomingEvent {
  time: string;
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



type EventStatus = 'initial' | 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'past';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<EventStatus>('rejected');
  const [currentEventData, setCurrentEventData] = useState<EventData | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | number | null>(null);
  const [currentMode, setCurrentMode] = useState<'event' | 'webinar'>('event');
  const [hostingEvents, setHostingEvents] = useState<HostingEvent[]>([]);
  const [hostingWebinars, setHostingWebinars] = useState<HostingEvent[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [heroImage, setHeroImage] = useState<string>('');
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [upcomingWebinars, setUpcomingWebinars] = useState<UpcomingWebinar[]>([]);

  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=event-dashboard
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats`;
  const { user, member } = useAuth();
  const [isEventLoading, setIsEventLoading] = useState(true);
  const[isWebinarLoading, setIsWebinarLoading] = useState(true);
  const [isUpcomingEventsLoading, setIsUpcomingEventsLoading] = useState(true);
  const [isUpcomingWebinarsLoading, setIsUpcomingWebinarsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectEvent = () => {
    setCurrentStatus('initial');
    setCurrentEventId(null);
    setCurrentEventData(null);
    setCurrentMode('event');
    setIsFormModalOpen(true);
    console.log('Advertise Event selected');
  };
  const handleOpenAdvertiseModal = (
    status: EventStatus,
    eventId?: string | number,
    eventData?: EventData | null,
    mode?: 'event' | 'webinar'
  ) => {
    setCurrentStatus(status);
    setCurrentEventId(eventId || null);
    setCurrentEventData(eventData || null);
    setCurrentMode(mode || ((eventData as StrapiEventData)?.eventType === 'Online' ? 'webinar' : 'event'));
    setIsFormModalOpen(true);
  };

  const handleSelectWebinar = () => {
    setCurrentStatus('initial');
    setCurrentEventId(null);
    setCurrentEventData(null);
    setCurrentMode('webinar');
    setIsFormModalOpen(true);
    console.log('Post Webinar selected');
  };

  async function fetchHostingEvents() {
    setIsEventLoading(true);
    if (!member?.organisationInfo?.companyName) {
      setIsEventLoading(false);
      return;
    }
    try {
      const orgName = member?.organisationInfo?.companyName;

      // Fetch hosted events using the strapi utility
      const allRawEvents = await strapi.eventApi.fetchHostedEvents(orgName);

      console.log('Hosted events:', allRawEvents);

      // Remove duplicates by documentId if any (though unlikely with single endpoint)
      const uniqueEvents = allRawEvents.filter(
        (event, index, self) =>
          index ===
          self.findIndex(
            (e) =>
              (e.documentId || e.attributes?.documentId) ===
              (event.documentId || event.attributes?.documentId)
          )
      );

      // Events are already sorted by startDateTime ascending from the API

      const normalized: HostingEvent[] = uniqueEvents.map((ev: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evAny = ev as any;
        const imageUrl = evAny?.image?.image?.url
          ? getStrapiMediaUrl(evAny.image.image.url)
          : evAny?.image?.url
            ? getStrapiMediaUrl(evAny.image.url)
            : '';

        const title = evAny?.title || evAny?.attributes?.title || '';
        const organization = evAny?.organizer || evAny?.attributes?.organizer || orgName;
        const start = evAny?.startDateTime || evAny?.attributes?.startDateTime || null;
        const end = evAny?.endDateTime || evAny?.attributes?.endDateTime || null;
        const dateStr = formatEventDate(start, end);

        // Check if past event
        let isPast = false;
        if (end && new Date(end) < new Date()) {
          isPast = true;
        }

        let status = (evAny?.eventStatus ||
          evAny?.attributes?.status) as HostingEvent['status'];
        if (!status) {
          console.log('no status');
          status = 'draft';
        }
        status = status.toLowerCase() as HostingEvent['status'];

        if (isPast) {
          status = 'past';
        }

        const hasNotification = status === 'rejected' || status === 'approved';
        const actionButton =
          status === 'approved' ? 'publish' : undefined;

        return {
          id: evAny?.documentId || evAny?.attributes?.documentId || evAny?.id,
          title,
          organization,
          date: dateStr,
          location: evAny?.location || evAny?.attributes?.location || '',
          status,
          imageUrl,
          eventData: ev as StrapiEventData,
          ...(hasNotification && { hasNotification }),
          ...(actionButton && { actionButton }),
        };
      });

      setHostingEvents(normalized);
    } catch (error) {
      console.error('Error loading hosting events:', error);
      setHostingEvents([]);
    } finally {
      setIsEventLoading(false);
    }
  }

  async function fetchHostingWebinars() {
    setIsWebinarLoading(true);
    if (!member?.organisationInfo?.companyName) {
      setIsWebinarLoading(false);
      return;
    }
    try {
      const orgName = member?.organisationInfo?.companyName;

      // Fetch hosted webinars using the strapi utility
      const allRawWebinars = await strapi.webinarApi.fetchHostedWebinars(orgName);

      console.log('Hosted webinars:', allRawWebinars);

      // Remove duplicates by documentId if any
      const uniqueWebinars = allRawWebinars.filter(
        (webinar, index, self) =>
          index ===
          self.findIndex(
            (w) =>
              (w.documentId || w.attributes?.documentId) ===
              (webinar.documentId || webinar.attributes?.documentId)
          )
      );

      // Webinars are already sorted by startDate ascending from the API

      const normalizedWebinars: HostingEvent[] = uniqueWebinars.map((web: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const webAny = web as any;
        const imageUrl = webAny?.image?.image?.url
          ? getStrapiMediaUrl(webAny.image.image.url)
          : webAny?.image?.url
            ? getStrapiMediaUrl(webAny.image.url)
            : '';

        const title = webAny?.title || webAny?.attributes?.title || '';
        const organization = webAny?.organizer || webAny?.attributes?.organizer || orgName;
        const start = webAny?.startDate || webAny?.attributes?.startDate || null;
        const dateStr = formatEventDate(start, null); // Webinars have single date

        // Check if past webinar
        let isPast = false;
        if (start && new Date(start) < new Date()) {
          isPast = true;
        }

        let status = (webAny?.webinarStatus ||
          webAny?.attributes?.webinarStatus) as HostingEvent['status'];
        if (!status) {
          status = 'draft';
        }
        status = status.toLowerCase() as HostingEvent['status'];

        if (isPast) {
          status = 'past';
        }

        const hasNotification = status === 'rejected' || status === 'approved';
        const actionButton =
          status === 'approved' ? 'publish' : undefined;

        return {
          id: webAny?.documentId || webAny?.attributes?.documentId || webAny?.id,
          title,
          organization,
          date: dateStr,
          location: webAny?.location || webAny?.attributes?.location || 'Online',
          status,
          imageUrl,
          eventData: web as StrapiEventData,
          ...(hasNotification && { hasNotification }),
          ...(actionButton && { actionButton }),
        };
      });

      setHostingWebinars(normalizedWebinars);
    } catch (error) {
      console.error('Error loading hosting webinars:', error);
      setHostingWebinars([]);
    } finally {
      setIsWebinarLoading(false);
    }
  }

  async function fetchUpcomingEvents() {
    setIsUpcomingEventsLoading(true);
    try {
      // Fetch upcoming events
      const nowIso = new Date().toISOString();
      const eventsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?filters[$or][0][startDateTime][$gte]=${encodeURIComponent(nowIso)}&filters[$or][1][endDateTime][$gte]=${encodeURIComponent(nowIso)}&sort[0]=startDateTime:asc&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats`;

      const eventsRes = await fetch(eventsUrl);
      if (!eventsRes.ok) {
        throw new Error(`HTTP error! status: ${eventsRes.status}`);
      }
      const eventsJson = await eventsRes.json();
      const rawEvents: unknown[] = Array.isArray(eventsJson?.data) ? eventsJson.data : [];

      const normalizedUpcoming = rawEvents.map((ev: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evAny = ev as any;
        const imageData = evAny?.image || evAny?.attributes?.image;
        const imageUrl = imageData?.image?.url
          ? getStrapiMediaUrl(imageData.image.url)
          : imageData?.url
            ? getStrapiMediaUrl(imageData.url)
            : FALLBACK_IMAGE;

        const start = evAny?.startDateTime || evAny?.attributes?.startDateTime || null;
        const end = evAny?.endDateTime || evAny?.attributes?.endDateTime || null;
        const dateStr = formatEventDate(start, end);

        const title = evAny?.title || evAny?.attributes?.title || '';
        const organization = evAny?.organizer || evAny?.attributes?.organizer || '';
        const location = evAny?.location || evAny?.attributes?.location || '';
        const description = evAny?.shortDescription || evAny?.attributes?.shortDescription || '';

        const slug = evAny?.slug || evAny?.attributes?.slug || '';

        return {
          title,
          organization,
          date: dateStr,
          location,
          slug,
          status: [] as const,
          description,
          imageUrl,
          buttonLabel: 'Learn more',
          buttonVariant: 'learn-more' as const,
        };
      }).filter(Boolean);

      setUpcomingEvents(normalizedUpcoming);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setIsUpcomingEventsLoading(false);
    }
  }

  async function fetchUpcomingWebinars() {
    setIsUpcomingWebinarsLoading(true);
    try {
      // Fetch upcoming webinars
      const nowIso = new Date().toISOString();
      const webinarsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?filters[startDate][$gte]=${encodeURIComponent(nowIso)}&sort[0]=startDate:asc&populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats`;

      const webinarsRes = await fetch(webinarsUrl);
      if (!webinarsRes.ok) {
        throw new Error(`HTTP error! status: ${webinarsRes.status}`);
      }
      const webinarsJson = await webinarsRes.json();
      const rawWebinars: unknown[] = Array.isArray(webinarsJson?.data) ? webinarsJson.data : [];

      const normalizedUpcomingWebinars = rawWebinars.map((web: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const webAny = web as any;
        const imageData = webAny?.image || webAny?.attributes?.image;
        const imageUrl = imageData?.image?.url
          ? getStrapiMediaUrl(imageData.image.url)
          : imageData?.url
            ? getStrapiMediaUrl(imageData.url)
            : FALLBACK_IMAGE;

        const start = webAny?.startDate || webAny?.attributes?.startDate || null;
        const end = webAny?.endDate || webAny?.attributes?.endDate || null;
        const dateStr = formatEventDate(start, end);

        const title = webAny?.title || webAny?.attributes?.title || '';
        const organization = webAny?.organizer || webAny?.attributes?.organizer || '';
        const location = webAny?.location || webAny?.attributes?.location || 'Online';
        const description = webAny?.shortDescription || webAny?.attributes?.shortDescription || '';

        let time = '';
        if (start) {
          const startTime = new Date(start).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          if (end && new Date(end).getTime() > new Date(start).getTime()) {
            const endTime = new Date(end).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            time = `${startTime} - ${endTime} (GMT +4)`;
          } else {
            time = `${startTime} (GMT +4)`;
          }
        }

        const slug = webAny?.slug || webAny?.attributes?.slug || '';

        return {
          title,
          organization,
          date: dateStr,
          time,
          location,
          slug,
          status: [] as const,
          description,
          imageUrl,
          buttonLabel: 'Learn more',
          buttonVariant: 'learn-more' as const,
        };
      }).filter(Boolean);

      setUpcomingWebinars(normalizedUpcomingWebinars);
    } catch (error) {
      console.error('Error fetching upcoming webinars:', error);
      setUpcomingWebinars([]);
    } finally {
      setIsUpcomingWebinarsLoading(false);
    }
  }

  useEffect(() => {
    fetchHostingEvents();
  }, [member, refreshTrigger]);

  useEffect(() => {
    fetchHostingWebinars();
  }, [member, refreshTrigger]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchUpcomingWebinars();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchPageHero() {
      try {
        const res = await fetch(pageUrl);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        const page = json.data?.[0];
        if (page) {
          const contents = page.contents || [];
          const heroSection = contents.find((c: { __component?: string }) => c.__component === 'sections.sections-hero');
          if (heroSection?.heroBanner?.image?.url) {
            setHeroImage(getStrapiMediaUrl(heroSection.heroBanner.image.url));
          } else if (heroSection?.heroBanner?.image?.formats?.large?.url) {
            setHeroImage(getStrapiMediaUrl(heroSection.heroBanner.image.formats.large.url));
          } else {
            setHeroImage(FALLBACK_IMAGE);
          }
        }
      } catch (error) {
        console.error('Error fetching page hero:', error);
        setHeroImage(FALLBACK_IMAGE);
      }
    }
    fetchPageHero();
  }, []);

  return (
    <div className="min-h-screen bg-wfzo-gold-25 relative">
      <HeroAuth backgroundImage={heroImage || FALLBACK_IMAGE} />
      {showBanner && (
        
         <DraftSavedBanner  
          message={
          currentMode === 'webinar'
          ? 'Webinar has been saved as draft'
          : 'Event has been saved as draft'
          }
          onDismiss={()=>setShowBanner(false)}></DraftSavedBanner>
      )}
      <div className="px-5 md:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <IncompleteProfileBanner/>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link href="/events/all-events">
              <button className=" w-full flex cursor-pointer items-center gap-4 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors">
                <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1667 26.6667C18 26.6667 17.0139 26.2639 16.2083 25.4583C15.4028 24.6528 15 23.6667 15 22.5C15 21.3333 15.4028 20.3472 16.2083 19.5417C17.0139 18.7361 18 18.3333 19.1667 18.3333C20.3333 18.3333 21.3194 18.7361 22.125 19.5417C22.9306 20.3472 23.3333 21.3333 23.3333 22.5C23.3333 23.6667 22.9306 24.6528 22.125 25.4583C21.3194 26.2639 20.3333 26.6667 19.1667 26.6667ZM3.33333 33.3333C2.41667 33.3333 1.63194 33.0069 0.979167 32.3542C0.326389 31.7014 0 30.9167 0 30V6.66667C0 5.75 0.326389 4.96528 0.979167 4.3125C1.63194 3.65972 2.41667 3.33333 3.33333 3.33333H5V1.66667C5 1.19444 5.15972 0.798611 5.47917 0.479167C5.79861 0.159722 6.19444 0 6.66667 0C7.13889 0 7.53472 0.159722 7.85417 0.479167C8.17361 0.798611 8.33333 1.19444 8.33333 1.66667V3.33333H21.6667V1.66667C21.6667 1.19444 21.8264 0.798611 22.1458 0.479167C22.4653 0.159722 22.8611 0 23.3333 0C23.8056 0 24.2014 0.159722 24.5208 0.479167C24.8403 0.798611 25 1.19444 25 1.66667V3.33333H26.6667C27.5833 3.33333 28.3681 3.65972 29.0208 4.3125C29.6736 4.96528 30 5.75 30 6.66667V30C30 30.9167 29.6736 31.7014 29.0208 32.3542C28.3681 33.0069 27.5833 33.3333 26.6667 33.3333H3.33333ZM3.33333 30H26.6667V13.3333H3.33333V30ZM3.33333 10H26.6667V6.66667H3.33333V10Z" fill="#8B6941"/>
                </svg>
                <span className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                  View All Events
                </span>
              </button>
              </Link>
              <Link href="/webinars/all-webinars">
              <button className="w-full flex cursor-pointer items-center gap-4 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors">
                <svg width="35" height="31" viewBox="0 0 35 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M32.5 28.3975V3.01292C32.5 2.86319 32.4519 2.74028 32.3558 2.64417C32.2597 2.54806 32.1368 2.5 31.9871 2.5H3.01292C2.86319 2.5 2.74028 2.54806 2.64417 2.64417C2.54806 2.74028 2.5 2.86319 2.5 3.01292V14.5833C2.5 14.9375 2.38014 15.2343 2.14042 15.4738C1.90069 15.7135 1.60375 15.8333 1.24958 15.8333C0.895139 15.8333 0.598333 15.7135 0.359167 15.4738C0.119722 15.2343 0 14.9375 0 14.5833V3.01292C0 2.18431 0.295 1.475 0.885 0.885C1.475 0.295 2.18431 0 3.01292 0H31.9871C32.8157 0 33.525 0.295 34.115 0.885C34.705 1.475 35 2.18431 35 3.01292V25.5929C35 26.3174 34.759 26.9471 34.2771 27.4821C33.7954 28.0174 33.2031 28.3225 32.5 28.3975ZM12.5 17.4038C10.8958 17.4038 9.52264 16.8326 8.38042 15.6904C7.23792 14.5479 6.66667 13.1746 6.66667 11.5704C6.66667 9.96625 7.23792 8.59306 8.38042 7.45083C9.52264 6.30833 10.8958 5.73708 12.5 5.73708C14.1042 5.73708 15.4774 6.30833 16.6196 7.45083C17.7621 8.59306 18.3333 9.96625 18.3333 11.5704C18.3333 13.1746 17.7621 14.5479 16.6196 15.6904C15.4774 16.8326 14.1042 17.4038 12.5 17.4038ZM12.5 14.9038C13.4167 14.9038 14.2014 14.5774 14.8542 13.9246C15.5069 13.2718 15.8333 12.4871 15.8333 11.5704C15.8333 10.6538 15.5069 9.86903 14.8542 9.21625C14.2014 8.56347 13.4167 8.23708 12.5 8.23708C11.5833 8.23708 10.7986 8.56347 10.1458 9.21625C9.49306 9.86903 9.16667 10.6538 9.16667 11.5704C9.16667 12.4871 9.49306 13.2718 10.1458 13.9246C10.7986 14.5774 11.5833 14.9038 12.5 14.9038ZM2.53208 30.0963C1.82903 30.0963 1.23125 29.85 0.73875 29.3575C0.24625 28.8647 0 28.2669 0 27.5642V26.3908C0 25.5747 0.221667 24.8189 0.665 24.1233C1.10833 23.4278 1.70083 22.8931 2.4425 22.5192C4.08972 21.7117 5.75153 21.106 7.42792 20.7021C9.10431 20.2982 10.795 20.0963 12.5 20.0963C14.205 20.0963 15.8957 20.2982 17.5721 20.7021C19.2485 21.106 20.9103 21.7117 22.5575 22.5192C23.2992 22.8931 23.8917 23.4278 24.335 24.1233C24.7783 24.8189 25 25.5747 25 26.3908V27.5642C25 28.2669 24.7538 28.8647 24.2613 29.3575C23.7688 29.85 23.171 30.0963 22.4679 30.0963H2.53208ZM2.5 27.5963H22.5V26.3908C22.5 26.0533 22.4022 25.7408 22.2067 25.4533C22.0111 25.1661 21.7457 24.9317 21.4104 24.75C19.9743 24.0428 18.5101 23.5069 17.0179 23.1425C15.5254 22.7783 14.0194 22.5963 12.5 22.5963C10.9806 22.5963 9.47458 22.7783 7.98208 23.1425C6.48986 23.5069 5.02569 24.0428 3.58958 24.75C3.25431 24.9317 2.98889 25.1661 2.79333 25.4533C2.59778 25.7408 2.5 26.0533 2.5 26.3908V27.5963Z" fill="#8B6941"/>
                </svg>
                <span className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                  View All Webinars
                </span>
              </button>
              </Link>
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
              <div className='flex justify-between'>
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Upcoming Events
              </h2>
              {
                upcomingEvents.length > 2 ? (
                  <Link href="/events/all-events">
                    <button className="font-source text-base cursor-pointer font-bold leading-5 text-wfzo-gold-600 mr-auto">View all </button>
                  </Link>
                ) : undefined
              }

              </div>

              {isUpcomingEventsLoading ? (
                <div className="flex flex-col gap-6">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <EventCardSkeleton key={idx} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {upcomingEvents.slice(0, 2).map((event, idx) => (
                    <EventCard
                      key={idx}
                      {...event}
                      onClick={() => router.push(`/events/all-events/${event.slug}`)}
                      onLearnMore={() => router.push(`/events/all-events/${event.slug}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Webinars */}
            <section className="flex flex-col gap-6">
              <div className='flex justify-between'>
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Upcoming Webinars
              </h2>
              {
                upcomingWebinars.length > 2 ? (
                  <Link href="/webinars/all-webinars">
                    <button className="font-source text-base cursor-pointer font-bold leading-5 text-wfzo-gold-600 mr-auto">View all </button>
                  </Link>
                ) : undefined
              }

              </div>

              {isUpcomingWebinarsLoading ? (
                <div className="flex flex-col gap-6">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <EventCardSkeleton key={idx} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {upcomingWebinars.slice(0, 2).map((event, idx) => (
                    <EventCard
                      key={idx}
                      {...event}
                      onClick={() => router.push(`/webinars/all-webinars/${event.slug}`)}
                      onLearnMore={() => router.push(`/webinars/all-webinars/${event.slug}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Right Column */}
          <div className="flex flex-col gap-6">
            {/* Create Event/Webinar */}
            <SidebarSection
              onClick={handleOpenModal}
              className="cursor-pointer hover:bg-wfzo-gold-100 transition-colors"
            >
              <div className="flex flex-row items-center gap-3">
                <div className="flex-shrink-0">
                  <GoldButtonChevron>
                    <PlusIcon className="w-6 h-6" />
                  </GoldButtonChevron>
                </div>

                <h3 className="font-source text-base font-bold leading-5 text-wfzo-grey-800">
                  Create an Event or Webinar
                </h3>
              </div>
            </SidebarSection>

            {/* Events You're Hosting */}
            {isEventLoading  ? (
              <SidebarSkeleton />
            ) : (
            <SidebarSection
              title={`Events You're Hosting (${hostingEvents.length})`}
              action={
                hostingEvents.length > 5 ? (
                  <Link href="/events/your-events">
                    <button className="font-source text-base cursor-pointer font-bold leading-5 text-wfzo-gold-600 mr-auto">View all </button>
                  </Link>
                ) : undefined
              }
            >
              <div className="divide-y divide-wfzo-gold-200">
              {hostingEvents.slice(0, 5).map((event, idx) => (
                <div key={idx} className='py-4'>
                <EventListItem
                  title={event.title}
                  organization={event.organization}
                  date={event.date}
                  location={event.location}
                  status={event.status}
                  imageUrl={event.imageUrl}
                  hasNotification={event.hasNotification}
                  actionButton={event.actionButton}
                  onClick={() => {
                    const slug = (event.eventData as StrapiEventData)?.slug || (event.eventData as StrapiEventData)?.attributes?.slug;
                    if (event.status === 'published' || event.status === 'past') {
                      router.push(`/events/all-events/${slug}`);
                    } else {
                      handleOpenAdvertiseModal(event.status, event.id, event.eventData);
                    }
                  }}
                  onActionClick={
                    event.actionButton
                      ? () => handleOpenAdvertiseModal(event.status, event.id, event.eventData)
                      : undefined
                  }
                />
                </div>
              ))}
              </div>
            </SidebarSection>
            )}

            {/* Webinars You're Hosting */}
            {isWebinarLoading  ? (
              <SidebarSkeleton />
            ) : (
            <SidebarSection
              title={`Webinars You're Hosting (${hostingWebinars.length})`}
              action={
                hostingWebinars.length > 5 ? (
                  <Link href="/webinars/your-webinars">
                    <button className="font-source text-base cursor-pointer font-bold leading-5 text-wfzo-gold-600 mr-auto">View all </button>
                  </Link>
                ) : undefined
              }
            >
              <div className="divide-y divide-wfzo-gold-200">
              {hostingWebinars.slice(0, 5).map((webinar, idx) => (
                <div key={idx} className='py-4'>
                <EventListItem
                  title={webinar.title}
                  organization={webinar.organization}
                  date={webinar.date}
                  location={webinar.location}
                  status={webinar.status}
                  imageUrl={webinar.imageUrl}
                  hasNotification={webinar.hasNotification}
                  actionButton={webinar.actionButton}
                  onClick={() => {
                    const slug = (webinar.eventData as StrapiEventData)?.slug || (webinar.eventData as StrapiEventData)?.attributes?.slug;
                    if (webinar.status === 'published' || webinar.status === 'past') {
                      router.push(`/webinars/all-webinars/${slug}`);
                    } else {
                      handleOpenAdvertiseModal(webinar.status, webinar.id, webinar.eventData, 'webinar');
                    }
                  }}
                  onActionClick={
                    webinar.actionButton
                      ? () =>
                          handleOpenAdvertiseModal(
                            webinar.status,
                            webinar.id,
                            webinar.eventData,
                            'webinar'
                          )
                      : undefined
                  }
                />
                </div>
              ))}
              </div>
            </SidebarSection>
            )}
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
        status={currentStatus || 'past'}
        eventId={currentEventId}
        eventData={currentEventData}
        mode={currentMode}
        onSave={() => { 
          setRefreshTrigger((prev) => prev + 1);
          setShowBanner(true);
        }}
        
      />
    </div>
  );
}

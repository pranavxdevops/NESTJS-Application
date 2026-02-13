import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import GoldButton from '@/shared/components/GoldButton';
import StatusBadge from '@/features/events/dashboard/component/StatusBadge';
import ContentSection from '@/shared/components/ContentSection';
import { ArrowLeft } from 'lucide-react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Link from 'next/link';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';

interface EventDetailSection {
  title?: string;
  description?: string;
  imagePosition?: string;
  image?: {
    image?: {
      url?: string;
    };
  };
}

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

interface RawEventDetailSection {
  title?: string;
  description?: string;
  imagePosition?: 'left' | 'right';
  image?: any;
}

interface TransformedEventDetailSection {
  title: string;
  content: string;
  imagePosition: 'left' | 'right';
  imageUrl: string;
}

export default async function AllEventsDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing event slug</div>;
  }

  const eventSlug = Array.isArray(slug) ? slug[0] : slug;

  // Fetch event data
  const eventUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?status=draft&filters[slug][$eq]=${encodeURIComponent(eventSlug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[event_details][populate][image][populate][image][fields][0]=url&populate[Seo][populate]=*`;

  const eventRes = await fetch(eventUrl, {
    next: { revalidate: 21600, tags: ['/api/events'] },
  });

  if (!eventRes.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch event</div>;
  }

  const eventJson = await eventRes.json();
  const eventData = eventJson?.data?.[0];
  
  if (!eventData) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Event not found</div>;
  }

  // Determine event status
  const now = new Date();
  const startDate = eventData?.startDateTime ? new Date(eventData.startDateTime) : null;
  const endDate = eventData?.endDateTime ? new Date(eventData.endDateTime) : null;

  let eventStatus: 'event' | 'past' | 'ongoing' | 'registered' = 'event';
  if (endDate && endDate < now) {
    eventStatus = 'past';
  } else if (startDate && endDate && startDate <= now && now <= endDate) {
    eventStatus = 'ongoing';
  }

  // Format date
  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  let dateStr = '';
  if (startDate && endDate) {
    dateStr = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } else if (startDate) {
    dateStr = formatDate(startDate);
  } else if (endDate) {
    dateStr = formatDate(endDate);
  }

  // Format time
  const timeStr = startDate
    ? startDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (GMT +4)'
    : '';

  // Get hero image from event
  // const heroImage = getStrapiMediaUrl(eventData?.image?.image?.url) || FALLBACK_IMAGE;

  // Transform event details sections
  const eventDetails: TransformedEventDetailSection[] = Array.isArray(eventData?.event_details)
    ? eventData.event_details.map((d: RawEventDetailSection) => {
        let imageUrl = FALLBACK_IMAGE;
        if (d.image) {
          // Handle Strapi v4 structure: image.data.attributes.url
          if (d.image.data?.attributes?.url) {
            imageUrl = getStrapiMediaUrl(d.image.data.attributes.url);
          }
          // Handle legacy or direct structure: image.image.url or image.url
          else if (d.image.image?.url) {
            imageUrl = getStrapiMediaUrl(d.image.image.url);
          } else if (d.image.url) {
            imageUrl = getStrapiMediaUrl(d.image.url);
          }
        }
        return {
          title: d.title || 'Event detail title',
          content: d.description || 'Event detail description',
          imagePosition: d.imagePosition || 'left',
          imageUrl,
        };
      })
    : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Events", href: "/events/dashboard", isHome: false },
    { label: "All Events", href: "/events/all-events", isHome: false },
    { label: eventData?.title || 'Event name', isCurrent: true }
  ];

  return (
    <div className="bg-wfzo-gold-25 min-h-screen">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

      {/* MAIN CONTENT CONTAINER */}
      <div className="px-5 md:px-30 py-10">
        {/* BACK BUTTON */}
        <Link 
          href="/events/all-events"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

        {/* BREADCRUMB */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* EVENT HEADER */}
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-montserrat text-4xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
            {eventData?.title || 'Event Name'}
          </h1>

          {eventData?.organizer && (
            <a
              href="#"
              className="font-source text-base text-wfzo-gold-600 underline w-fit"
            >
              {eventData.organizer}
            </a>
          )}

          {/* DATE */}
          <div className="flex items-center gap-3">
            <p className="font-source text-xl text-wfzo-grey-800">
              {dateStr}
              {eventData?.eventType && ` (${eventData.eventType})`}
            </p>
          </div>

          {/* TIME AND LOCATION */}
          <div className="flex items-center gap-4 flex-wrap">
            {timeStr && (
              <p className="font-source text-sm text-wfzo-grey-700">
                {timeStr}
              </p>
            )}
            {timeStr && eventData?.location && (
              <span className="text-wfzo-grey-700">-</span>
            )}
            {eventData?.location && (
              <p className="font-source text-sm text-wfzo-grey-700">
                {eventData.location}
              </p>
            )}
          </div>

          {/* STATUS BADGE */}
          <div>
            <StatusBadge status={eventStatus} />
          </div>

          {/* DESCRIPTION */}
          {eventData?.shortDescription && (
            <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
              {eventData.shortDescription}
            </p>
          )}

          {/* REGISTER BUTTON */}
          {eventData?.cta && (
            <div className="mt-2">
              <Link href={eventData.cta.href || ''}>
                <GoldButton>
                  {eventData.cta.title || 'Register here'}
                </GoldButton>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      {eventDetails && eventDetails.length > 0 && (
        <div className="w-full max-w-full mx-auto">
          {eventDetails.map((section: TransformedEventDetailSection, index: number) => {
            const imageUrl = section.imageUrl || FALLBACK_IMAGE;
    
            return (
              <div key={index}>
                <ContentSection
                  title={section.title}
                  content={section.content}
                  imageUrl={imageUrl}
                  imagePosition={section.imagePosition}
                  imageHeight="tall"
                  alignment="center"
                  className={index > 0 ? "pt-0 md:pt-0 pb-0 md:pb-0" : ""}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM REGISTER BUTTON */}
      {eventDetails && eventDetails.length > 0 && eventData?.cta && (
        <div className="flex justify-center py-12">
          <Link href={eventData.cta?.href || ''}>
            <GoldButton>
              {eventData.cta.title || 'Register here'}
            </GoldButton>
          </Link>
        </div>
      )}
    </div>
  );
}

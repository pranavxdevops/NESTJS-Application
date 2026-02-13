'use client';

import React, { useEffect, useState, useMemo } from 'react';
import YourEventsCard from '@/features/events/dashboard/component/YourEventsCard';
import GoldButton from '@/shared/components/GoldButton';
import { useRouter } from 'next/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { useAuth } from '@/lib/auth/useAuth';
import { strapi } from '@/lib/strapi';
import EventCardSkeleton from '@/features/events/dashboard/component/EventCardSkeleton';

type EventWebinarData = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  imageUrl?: string;
  status?: 'past' | 'event' | 'webinar';
  startDateTime?: string | null;
  endDateTime?: string | null;
  isPast: boolean;
  type: 'event' | 'webinar';
};

const ITEMS_PER_PAGE = 6;

export function EventsWebinarsTab({organizationName}: {organizationName: string}) {
  const router = useRouter();
  
  // const { member } = useAuth();

  const [allItems, setAllItems] = useState<EventWebinarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingVisibleCount, setUpcomingVisibleCount] = useState(ITEMS_PER_PAGE);
  const [pastVisibleCount, setPastVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
   
    fetchAllItems();
  }, [organizationName]);

  const formatDate = (start?: string | null, end?: string | null) => {
    if (!start) return '';
    const s = new Date(start);

    if (end) {
      const e = new Date(end);
      if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
        return `${s.getDate()}-${e.getDate()} ${s.toLocaleString(undefined, {
          month: 'short',
        })}, ${s.getFullYear()}`;
      }
    }

    return s.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchAllItems = async () => {
    try {
      setLoading(true);

      // const orgName = member!.organisationInfo.companyName;
      const now = new Date();

      const [rawEvents, rawWebinars] = await Promise.all([
        strapi.eventApi.fetchHostedEvents(organizationName),
        strapi.webinarApi.fetchHostedWebinars(organizationName),
      ]);
      console.log("rawEvents", rawEvents);
      

      const events: EventWebinarData[] = rawEvents.map((ev: any) => {
        const start = ev?.startDateTime || ev?.attributes?.startDateTime;
        const end = ev?.endDateTime || ev?.attributes?.endDateTime;

        const isPast = end ? new Date(end) < now : start ? new Date(start) < now : false;

        return {
          id: String(ev.documentId || ev.id),
          slug: ev.slug || ev.attributes?.slug || '',
          title: ev.title || ev.attributes?.title || '',
          organization: ev.organizer || organizationName,
          date: formatDate(start, end),
          location: ev.location || ev.attributes?.location || '',
          imageUrl: ev?.image?.image?.url ? getStrapiMediaUrl(ev.image.image.url) : '',
          startDateTime: start,
          endDateTime: end,
          isPast,
          status: isPast ? 'past' : 'event',
          type: 'event',
        };
      });

      const webinars: EventWebinarData[] = rawWebinars.map((wb: any) => {
        const start = wb?.startDate || wb?.attributes?.startDate;
        const isPast = start ? new Date(start) < now : false;

        return {
          id: String(wb.documentId || wb.id),
          slug: wb.slug || wb.attributes?.slug || '',
          title: wb.title || wb.attributes?.title || '',
          organization: wb.organizer || organizationName,
          date: formatDate(start, null),
          location: wb.location || 'Online',
          imageUrl: wb?.image?.image?.url ? getStrapiMediaUrl(wb.image.image.url) : '',
          startDateTime: start,
          endDateTime: null,
          isPast,
          status: isPast ? 'past' : 'webinar',
          type: 'webinar',
        };
      });

      setAllItems([...events, ...webinars]);
    } catch (error) {
      console.error('Error fetching hosted events & webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingItems = useMemo(() => allItems.filter((item) => !item.isPast), [allItems]);

  const pastItems = useMemo(() => allItems.filter((item) => item.isPast), [allItems]);

  const pastItemsByYear = useMemo(() => {
    const map = new Map<string, EventWebinarData[]>();

    pastItems.forEach((item) => {
      const year = item.startDateTime
        ? new Date(item.startDateTime).getFullYear().toString()
        : 'Other';

      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(item);
    });

    return Array.from(map.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({ year, items }));
  }, [pastItems]);

  if (loading) {
    return (
      <div>
        {/* Intro Section Skeleton */}
      <div className="px-5 md:px-0 py-6">
        <div className="mb-6 animate-pulse space-y-3 max-w-[700px]">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>

{/* Upcoming Heading Skeleton */}
      <div className="mb-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-64 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div></div>
    );
  }

  return (
    <div>
      <div className="px-5 md:px-0 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <p className="text-wfzo-grey-700 font-source text-base leading-6 mb-4 max-w-[700px]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae purus sit
            amet risus lacinia varius in ut lorem. Cras efficitur dui non leo tincidunt, vitae
            posuere erat aliquam. Curabitur quis sodales libero, vel hendrerit eros.
          </p>
         
        </div>
      </div>

      {upcomingItems.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xl font-extrabold mb-6">Upcoming Events & Webinars</h3>

          {upcomingItems.length === 0 ? (
            <p>No upcoming events or webinars available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingItems.slice(0, upcomingVisibleCount).map((item) => (
                <YourEventsCard
                  key={item.id}
                  {...item}
                  showStatusBadge
                  buttonText="Learn more"
                  onButtonClick={() =>
                    router.push(
                      item.type === 'event'
                        ? `/events/your-events/${item.slug}`
                        : `/events/your-webinars/${item.slug}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {pastItems.length > 0 && (
        <div>
          <h3 className="text-xl font-extrabold mb-6">Past Events & Webinars</h3>

          {pastItemsByYear.map(({ year, items }) => (
            <div key={year} className="mb-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.slice(0, pastVisibleCount).map((item) => (
                  <YourEventsCard
                    key={item.id}
                    {...item}
                    showStatusBadge
                    buttonText="View Archive"
                    onButtonClick={() =>
                      router.push(
                        item.type === 'event'
                          ? `/events/your-events/${item.slug}`
                          : `/events/your-webinars/${item.slug}`
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

{upcomingItems.length === 0 && pastItems.length === 0 && (
  
  <p className='font-source'>No events or webinars available.</p>
)}

      {(upcomingItems.length > upcomingVisibleCount || pastItems.length > pastVisibleCount) && (
        <div className="flex justify-center pt-4">
          <GoldButton
            onClick={() => {
              setUpcomingVisibleCount((p) => p + ITEMS_PER_PAGE);
              setPastVisibleCount((p) => p + ITEMS_PER_PAGE);
            }}
          >
            Load more
          </GoldButton>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import YourEventsCard from '@/features/events/dashboard/component/YourEventsCard';
import GoldButton from '@/shared/components/GoldButton';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';

type EventData = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  imageUrl?: string;
  status?: 'registered' | 'past' | 'event' | 'webinar' | 'ongoing';
  startDateTime?: string | null;
  endDateTime?: string | null;
  isPast: boolean;
  isRegistered?: boolean;
};

const ITEMS_PER_PAGE = 6;

export default function AllEventsPage() {
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const [upcomingVisibleCount, setUpcomingVisibleCount] = useState(ITEMS_PER_PAGE);
  const [pastVisibleCount, setPastVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch all events from API (both upcoming and past)
      const eventsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats&populate[cta][populate]=*&sort[0]=startDateTime:desc`;
      
      const response = await fetch(eventsUrl, { 
        next: { revalidate: 300, tags: ['/api/events'] } 
      });
      
      const data = await response.json();
      const rawEvents: any[] = Array.isArray(data?.data) ? data.data : [];
      
      const now = new Date();
      
      const normalizedEvents: EventData[] = rawEvents.map((ev, index) => {
        const startDate = ev?.startDateTime ? new Date(ev.startDateTime) : null;
        const endDate = ev?.endDateTime ? new Date(ev.endDateTime) : null;
        
        // Determine if event is past
        const isPast = endDate ? endDate < now : (startDate ? startDate < now : false);
        
        // Format date range
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
          : undefined;
        
        // Get image URL
        

          const imageUrl = ev?.image?.image?.url
                      ? getStrapiMediaUrl(ev.image.image.url)
                      : ev?.image?.url
                        ? getStrapiMediaUrl(ev.image.url)
                        : '';
        
        // Mock registered status (you can replace with actual logic)
        const isRegistered = index % 3 === 0; // Every 3rd event is "registered"
        
        return {
          id: ev.id || String(index),
          slug: ev?.slug || '',
          title: ev?.title || 'Untitled Event',
          organization: ev?.organizer || 'World Free Zones Organization',
          date: dateStr,
          time: timeStr,
          location: ev?.location || '',
          imageUrl,
          status: isRegistered ? 'registered' : undefined,
          startDateTime: ev?.startDateTime,
          endDateTime: ev?.endDateTime,
          isPast,
          isRegistered
        };
      });
      
      setAllEvents(normalizedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    if (showOnlyRegistered) {
      return allEvents.filter(event => event.isRegistered);
    }
    return allEvents;
  }, [allEvents, showOnlyRegistered]);

  // Separate upcoming and past events
  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(event => !event.isPast);
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    return filteredEvents.filter(event => event.isPast);
  }, [filteredEvents]);

  // Group past events by year
  const pastEventsByYear = useMemo(() => {
    const grouped = new Map<string, EventData[]>();
    
    pastEvents.forEach(event => {
      const year = event.startDateTime 
        ? new Date(event.startDateTime).getFullYear().toString()
        : event.endDateTime 
        ? new Date(event.endDateTime).getFullYear().toString()
        : 'Other';
      
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(event);
    });
    
    // Sort years in descending order
    const sortedYears = Array.from(grouped.keys()).sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return bNum - aNum;
      }
      return a.localeCompare(b);
    });
    
    return sortedYears.map(year => ({
      year,
      events: grouped.get(year)!
    }));
  }, [pastEvents]);

  const visibleUpcomingEvents = upcomingEvents.slice(0, upcomingVisibleCount);
  const hasMoreUpcoming = upcomingEvents.length > upcomingVisibleCount;

  const visiblePastEventsByYear = pastEventsByYear.map(({ year, events }) => ({
    year,
    events: events.slice(0, pastVisibleCount)
  }));
  const hasMorePast = pastEvents.length > pastVisibleCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-wfzo-grey-700">Loading events...</p>
      </div>
    );
  }
  const breadcrumbItems: BreadcrumbItem[] = [
      { label: "Events", href: "/events/dashboard", isHome: false },
      { label: "All Events", href: "/events/all-events", isCurrent: true },
    ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Image */}
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

      {/* Content */}
      <div className="px-5 md:px-30 py-10 flex flex-col gap-10">
        {/* Back Button and Breadcrumb */}
        <Link 
          href="/events/dashboard"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

        <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
        </div>



        {/* Toggle */}
        <div className="flex items-center gap-3 py-1">
          <button
            onClick={() => setShowOnlyRegistered(!showOnlyRegistered)}
            className={`w-8 h-5 rounded-full transition-colors relative ${
              showOnlyRegistered ? 'bg-wfzo-gold-600' : 'bg-wfzo-grey-400'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                showOnlyRegistered ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="font-source text-sm text-wfzo-grey-800">
            View only Registered Events
          </span>
        </div>

        {/* Upcoming Events */}
        <div className="flex flex-col gap-6">
          <h2 className="font-montserrat text-2xl font-extrabold text-wfzo-grey-900">
            Upcoming Events
          </h2>
          
          {visibleUpcomingEvents.length === 0 ? (
            <p className="text-wfzo-grey-700">No upcoming events available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleUpcomingEvents.map((event) => (
                <YourEventsCard
                  key={event.id}
                  title={event.title}
                  organization={event.organization}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  imageUrl={event.imageUrl}
                  status={event.status}
                  showStatusBadge={true}
                  buttonText="Learn more"
                  onButtonClick={() => {
                    router.push(`/events/all-events/${event.slug}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-montserrat text-2xl font-extrabold text-wfzo-grey-900">
              Past Events
            </h2>
          </div>
          
          {visiblePastEventsByYear.length === 0 ? (
            <p className="text-wfzo-grey-700">No past events available.</p>
          ) : (
            visiblePastEventsByYear.map(({ year, events }) => (
              <div key={year} className="flex flex-col gap-6">
                <h3 className="font-montserrat text-[32px] font-black leading-10 text-wfzo-grey-900">
                  {year}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {events.map((event) => (
                    <YourEventsCard
                      key={event.id}
                      title={event.title}
                      organization={event.organization}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                      imageUrl={event.imageUrl}
                      status={event.status}
                      showStatusBadge={true}
                      buttonText="View Archive"
                      onButtonClick={() => {
                        router.push(`/events/all-events/${event.slug}`);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {(hasMoreUpcoming || hasMorePast) && (
          <div className="flex justify-center pt-4">
            <GoldButton 
              onClick={() => {
                if (hasMoreUpcoming) {
                  setUpcomingVisibleCount(prev => prev + ITEMS_PER_PAGE);
                }
                if (hasMorePast) {
                  setPastVisibleCount(prev => prev + ITEMS_PER_PAGE);
                }
              }}
            >
              Load more
            </GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import YourEventsCard from '@/features/events/dashboard/component/YourEventsCard';
import GoldButton from '@/shared/components/GoldButton';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';

type RawWebinar = {
  id: string;
  title?: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  image?: {
    image?: {
      url: string;
    };
    url?: string;
  };
};

type WebinarData = {
  slug: string;
  id: string;
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  imageUrl?: string;
  status?: 'registered' | 'past' | 'event' | 'webinar' | 'ongoing';
  startDate?: string | null;
  endDate?: string | null;
  isPast: boolean;
  isRegistered?: boolean;
};

const ITEMS_PER_PAGE = 6;

export default function AllWebinarsPage() {
  const router = useRouter();
  const [allWebinars, setAllWebinars] = useState<WebinarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const [upcomingVisibleCount, setUpcomingVisibleCount] = useState(ITEMS_PER_PAGE);
  const [pastVisibleCount, setPastVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchAllWebinars();
  }, []);

  const fetchAllWebinars = async () => {
    try {
      setLoading(true);
      
      // Fetch all webinars from API (both upcoming and past)
      const webinarsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats&populate[cta][populate]=*&sort[0]=startDate:desc`;
      
      const response = await fetch(webinarsUrl, { 
        next: { revalidate: 300, tags: ['/api/webinars'] } 
      });
      
      const data = await response.json();
      const rawWebinars = Array.isArray(data?.data) ? data.data : [];
      
      const now = new Date();
      
      const normalizedWebinars: WebinarData[] = rawWebinars.map((ev: any, index: number) => {
        const startDate = ev?.startDate ? new Date(ev.startDate) : null;
        const endDate = ev?.endDate ? new Date(ev.endDate) : null;
        
        // Determine if webinar is past
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
        const isRegistered = index % 3 === 0; // Every 3rd webinar is "registered"
        
        return {
          id: ev.id || String(index),
          slug: ev.slug || `webinar-${index}`,
          title: ev?.title || 'Untitled Webinar',
          organization: ev?.organizer || 'World Free Zones Organization',
          date: dateStr,
          time: timeStr,
          location: ev?.location || '',
          imageUrl,
          status: isRegistered ? 'registered' : undefined,
          startDate: ev?.startDate,
          endDate: ev?.endDate,
          isPast,
          isRegistered
        };
      });
      
      setAllWebinars(normalizedWebinars);
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter webinars
  const filteredWebinars = useMemo(() => {
    if (showOnlyRegistered) {
      return allWebinars.filter(webinar => webinar.isRegistered);
    }
    return allWebinars;
  }, [allWebinars, showOnlyRegistered]);

  // Separate upcoming and past webinars
  const upcomingWebinars = useMemo(() => {
    return filteredWebinars.filter(webinar => !webinar.isPast);
  }, [filteredWebinars]);

  const pastWebinars = useMemo(() => {
    return filteredWebinars.filter(webinar => webinar.isPast);
  }, [filteredWebinars]);

  // Group past webinars by year
  const pastWebinarsByYear = useMemo(() => {
    const grouped = new Map<string, WebinarData[]>();
    
    pastWebinars.forEach(webinar => {
      const year = webinar.startDate
        ? new Date(webinar.startDate).getFullYear().toString()
        : webinar.endDate
        ? new Date(webinar.endDate).getFullYear().toString()
        : 'Other';
      
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(webinar);
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
      webinars: grouped.get(year)!
    }));
  }, [pastWebinars]);

  const visibleUpcomingWebinars = upcomingWebinars.slice(0, upcomingVisibleCount);
  const hasMoreUpcoming = upcomingWebinars.length > upcomingVisibleCount;

  const visiblePastWebinarsByYear = pastWebinarsByYear.map(({ year, webinars }) => ({
    year,
    webinars: webinars.slice(0, pastVisibleCount)
  }));
  const hasMorePast = pastWebinars.length > pastVisibleCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-wfzo-grey-700">Loading webinars...</p>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
      { label: "Webinars", href: "/events/dashboard", isHome: false },
      { label: "All Webinars", isCurrent: true }
    ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
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
            View only Registered Webinars
          </span>
        </div>

        {/* Upcoming Webinars */}
        <div className="flex flex-col gap-6">
          <h2 className="font-montserrat text-2xl font-extrabold text-wfzo-grey-900">
            Upcoming Webinars
          </h2>
          
          {visibleUpcomingWebinars.length === 0 ? (
            <p className="text-wfzo-grey-700">No upcoming webinars available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleUpcomingWebinars.map((webinar) => (
                <YourEventsCard
                  key={webinar.id}
                  title={webinar.title}
                  organization={webinar.organization}
                  date={webinar.date}
                  time={webinar.time}
                  location={webinar.location}
                  imageUrl={webinar.imageUrl}
                  status={webinar.status}
                  showStatusBadge={true}
                  buttonText="Learn more"
                  onButtonClick={() => {
                    router.push(`/webinars/all-webinars/${webinar.slug}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Webinars */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-montserrat text-2xl font-extrabold text-wfzo-grey-900">
              Past Webinars
            </h2>
          </div>
          
          {visiblePastWebinarsByYear.length === 0 ? (
            <p className="text-wfzo-grey-700">No past webinars available.</p>
          ) : (
            visiblePastWebinarsByYear.map(({ year, webinars }) => (
              <div key={year} className="flex flex-col gap-6">
                <h3 className="font-montserrat text-[32px] font-black leading-10 text-wfzo-grey-900">
                  {year}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {webinars.map((webinar) => (
                    <YourEventsCard
                      key={webinar.id}
                      title={webinar.title}
                      organization={webinar.organization}
                      date={webinar.date}
                      time={webinar.time}
                      location={webinar.location}
                      imageUrl={webinar.imageUrl}
                      status={webinar.status}
                      showStatusBadge={true}
                      buttonText="View Archive"
                      onButtonClick={() => {
                        router.push(`/webinars/all-webinars/${webinar.slug}`);
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

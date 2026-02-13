'use client';

import { useEffect, useState, useMemo } from 'react';
import YourEventsCard from '@/features/events/dashboard/component/YourEventsCard';
import GoldButton from '@/shared/components/GoldButton';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import Hero from '@/features/about/components/Hero';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import ContentSection from '@/shared/components/ContentSection';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import transformWebinarsPage, { transformWebinarsList } from '@/lib/utils/transformWebinarsPage';

type WebinarData = {
  id: string;
  slug: string;
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
  ctaHref?: string; // CTA link for registration
};

type TabType = 'upcoming' | 'past';

const ITEMS_PER_PAGE = 6;

export default function WebinarsPage() {
  const router = useRouter();
  const [allWebinars, setAllWebinars] = useState<WebinarData[]>([]);
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [upcomingVisibleCount, setUpcomingVisibleCount] = useState(ITEMS_PER_PAGE);
  const [pastVisibleCount, setPastVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchPageData();
    fetchAllWebinars();
  }, []);

  const fetchPageData = async () => {
    try {
      // Fetch page data with hero, banner, ecosystem, and contact sections (same as slug page)
      const extrasUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=webinars&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats`;
      
      const response = await fetch(extrasUrl);
      const pageJson = await response.json();
      
      // Use transformer to normalize the data
      const transformedSections = transformWebinarsPage(pageJson);
      setSections(transformedSections);
      console.log('Transformed Sections:', transformedSections);
    } catch (error) {
      console.error('Error fetching page data:', error);
    }
  };

  const fetchAllWebinars = async () => {
    try {
      setLoading(true);
      
      // Fetch all webinars from API (both upcoming and past)
      const webinarsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats&populate[cta][populate]=*&sort[0]=startDate:desc`;
      
      const response = await fetch(webinarsUrl, { 
        next: { revalidate: 300, tags: ['/api/webinars'] } 
      });
      
      const data = await response.json();
      const rawWebinars: any[] = Array.isArray(data?.data) ? data.data : [];
      
      const now = new Date();
      
      const normalizedWebinars: WebinarData[] = rawWebinars.map((webinar, index) => {
        const startDate = webinar?.startDate ? new Date(webinar.startDate) : null;
        const endDate = webinar?.endDate ? new Date(webinar.endDate) : null;
        
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
        const imageUrl = webinar?.image?.image?.url
          ? getStrapiMediaUrl(webinar.image.image.url)
          : webinar?.image?.url
            ? getStrapiMediaUrl(webinar.image.url)
            : '';
        
        // Mock registered status (replace with actual logic)
        const isRegistered = index % 3 === 0;
        
        return {
          id: webinar.id || String(index),
          slug: webinar?.slug || `webinar-${index}`,
          title: webinar?.title || 'Untitled Webinar',
          organization: webinar?.organizer || 'World Free Zones Organization',
          date: dateStr,
          time: timeStr,
          location: webinar?.location || '',
          imageUrl,
          status: isRegistered ? 'registered' : 'webinar',
          startDate: webinar?.startDate,
          endDate: webinar?.endDate,
          isPast,
          isRegistered,
          ctaHref: webinar?.cta?.href || '',
        };
      });
      
      setAllWebinars(normalizedWebinars);
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate upcoming and past webinars
  const upcomingWebinars = useMemo(() => {
    return allWebinars.filter(webinar => !webinar.isPast);
  }, [allWebinars]);

const upcomingWebinarsByYear = useMemo(() => {
  const grouped = new Map<string, WebinarData[]>();

  upcomingWebinars.forEach(webinar => {
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

  // Sort years ascending (optional — upcoming usually earliest first)
  const sortedYears = Array.from(grouped.keys()).sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);

    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return aNum - bNum;
    }

    return a.localeCompare(b);
  });

  return sortedYears.map(year => ({
    year,
    webinars: grouped.get(year)!
  }));
}, [upcomingWebinars]);


  const pastWebinars = useMemo(() => {
    return allWebinars.filter(webinar => webinar.isPast);
  }, [allWebinars]);

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

  const visibleUpcomingWebinarsByYear = upcomingWebinarsByYear.map(({ year, webinars }) => ({
    year,
    webinars: webinars.slice(0, upcomingVisibleCount)
  }));
  const hasMoreUpcoming = upcomingWebinars.length > upcomingVisibleCount;

  const visiblePastWebinarsByYear = pastWebinarsByYear.map(({ year, webinars }) => ({
    year,
    webinars: webinars.slice(0, pastVisibleCount)
  }));
  const hasMorePast = pastWebinars.length > pastVisibleCount;

  const tabOptions = [
    { label: 'Upcoming Webinars', value: 'upcoming' },
    { label: 'Past Webinars', value: 'past' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-wfzo-grey-700">Loading webinars...</p>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/", isHome: true },
    { label: "Knowledge", href: "/knowledge/dashboard" },
    { label: "Webinars", isCurrent: true },
  ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Image */}
      {sections?.hero?.heroImage && <Hero imageUrl={sections.hero.heroImage} />}

      {/* Content */}
      <div className="px-5 md:px-30 py-10 flex flex-col gap-5">
        {/* Back Button */}
        

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Page Title and Description */}
        <div className="flex flex-col gap-4">
          <h1 className="font-montserrat text-4xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
            {sections?.hero?.title || 'Webinars'}
          </h1>
          <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
            {sections?.hero?.description || 'Join our expert-led webinars to stay informed about the latest trends and best practices in the free zone industry.'}
          </p>
        </div>
      </div>

      <div className="px-5 md:px-30 pb-10 flex flex-col gap-10">
        {/* Tabs - Using ScrollableTabs like photo/video gallery */}
        <ScrollableTabs
          options={tabOptions}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
        />

        {/* Upcoming Webinars Tab Content */}
        {activeTab === 'upcoming' && (
          <div className="flex flex-col gap-6">
            {visibleUpcomingWebinarsByYear.length === 0 ? (
              <p className="text-wfzo-grey-700">No upcoming webinars available.</p>
            ) : (
              visibleUpcomingWebinarsByYear.map(({ year, webinars }) => (
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
                        showStatusBadge={false}
                        buttonText="Register"
                        onCardClick={() => {
                          router.push(`/knowledge/webinars/${webinar.slug}`);
                        }}
                       onButtonClick={() => {
                      if (webinar.ctaHref) {
                        window.open(webinar.ctaHref, '_blank');
                      } else {
                        router.push(`/knowledge/webinars/${webinar.slug}`);
                      }
                    }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Load More for Upcoming */}
            {hasMoreUpcoming && (
              <div className="flex justify-center pt-4">
                <GoldButton 
                  onClick={() => setUpcomingVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                >
                  Load more
                </GoldButton>
              </div>
            )}
          </div>
        )}

        {/* Past Webinars Tab Content */}
        {activeTab === 'past' && (
          <div className="flex flex-col gap-6">
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
                        showStatusBadge={false}
                        buttonText="Read more"
                        onCardClick={() => {
                          router.push(`/knowledge/webinars/${webinar.slug}`);
                        }}
                        onButtonClick={() => {
                          router.push(`/knowledge/webinars/${webinar.slug}`);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Load More for Past */}
            {hasMorePast && (
              <div className="flex justify-center pt-4">
                <GoldButton 
                  onClick={() => setPastVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                >
                  Load more
                </GoldButton>
              </div>
            )}
          </div>
        )}
      </div>
              {sections?.banner && (
        <ContentSection
          title={sections.banner.title}
          content={sections.banner.description}
          imageUrl={
            sections.banner.imageUrl
              ? getStrapiMediaUrl(sections.banner.imageUrl)
              : FALLBACK_IMAGE
          }
          imagePosition={sections.banner.imagePosition || 'left'}
          alignment="center"
          cta={sections.banner.cta ?? undefined}
        />
      )}
      {/* Ecosystem / related items carousel — from shared page data */}
      {sections?.ecosystem && sections.ecosystem.cards && sections.ecosystem.cards.length > 0 && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem.cards.length}
          title={sections.ecosystem.title}
          description={sections.ecosystem.description}
          pageHeading={false}
          visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: 3, xl: 3 }}
          slidesToScroll={1}
          autoplay={true}
          autoplayDelay={5000}
          loop={true}
          showControls={true}
          showProgressBar={true}
          gap={16}
        >
          {sections.ecosystem.cards.map((card: any, idx: number) => (
            <div key={idx} className="h-full mb-6">
              <ExploreCard
                image={
                  card?.backgroundImage?.formats?.medium
                    ? getStrapiMediaUrl(card.backgroundImage.formats.medium)
                    : card?.backgroundImage?.url
                      ? getStrapiMediaUrl(card.backgroundImage.url)
                      : FALLBACK_IMAGE
                }
                title={card.title || ''}
                link={card.link || '/'}
              />
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {/* Contact / CTA footer section */}
      {sections?.contactUs && (
        <ContactSection
          title={sections.contactUs.title}
          description={sections.contactUs.description}
          backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
          cta={sections.contactUs.cta ?? undefined}
        />
      )}
    </div>
  );
}

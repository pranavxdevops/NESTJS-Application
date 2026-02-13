import ContentSection from '@/shared/components/ContentSection';
import ContactSection from '@/shared/components/ContactSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import TwinContentSection from '@/features/membership/components/TwinContentSection';
import transformEventDetailPage from '@/lib/utils/transformEventDetailPage';
import Hero from '@/features/about/components/Hero';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import { generateSeo } from '@/lib/utils/seo/generateSeo';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { EventTrackerWrapper } from './EventTrackerWrapper';

type PageProps = {
  params: Promise<{ slug: string[]; locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const eventSlug = Array.isArray(slug) ? slug[0] : slug;

  const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  const res = await fetch(
    `${STRAPI_BASE}/api/events?filters[slug][$eq]=${encodeURIComponent(eventSlug)}&locale=${locale}&[populate]=*`,
    { next: { revalidate: 21600, tags: [`/api/events/${eventSlug}`] } }
  );

  if (!res.ok) throw new Error(`Failed to fetch SEO for event: ${eventSlug}`);
  const json = await res.json();
  const eventData = json?.data?.[0];
  const seo = eventData?.Seo;
  const fullPath = eventData?.fullPath || `/events/${eventSlug}`;
  const urlSlug = `/events/${eventSlug}`;

  // 🧩 Use your existing SEO generator
  return generateSeo(seo, locale, urlSlug, fullPath);
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing event slug</div>;
  }
  const eventSlug = Array.isArray(slug) ? slug[0] : slug;

  // Build Strapi queries
  // 1) Event by slug with necessary nested fields
  const eventUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?filters[slug][$eq]=${encodeURIComponent(eventSlug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[event_details][populate][image][populate][image][fields][0]=url&populate[Seo][populate]=*`;
  // 2) Footer extras (ecosystem + contact-us) sourced from events page
  const extrasUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=upcoming-events
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats`;

  const eventRes = await fetch(eventUrl, {
    next: { revalidate: 21600, tags: ['/api/events-extras'] },
  });
  const extraRes = await fetch(extrasUrl, {
    next: { revalidate: 21600, tags: ['/api/events-extras'] },
  });

  if (!eventRes.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch event</div>;
  }

  const eventJson = await eventRes.json();
  const extraJson = await extraRes.json();
  const sections = transformEventDetailPage(eventJson, extraJson);
  
  
  const breadcrumbItems = buildBreadcrumbs(sections?.fullPath, {
      includeHome: true,
      homeLabel: 'Home',
      trailingItem: {
      label: sections?.title
    }
  });
  const eventData = eventJson?.data?.[0];
  const fullPath = eventData?.fullPath || `/events/${eventSlug}`;
  const startDateTime = eventData?.startDateTime;
  const urlSlug = `/events/${eventSlug}`;

  const seo = generateSeo(
  eventData?.Seo,
  locale,
  urlSlug,
  fullPath,
  startDateTime
);

  return (
    <div>
      <EventTrackerWrapper 
        eventId={eventData?.documentId || eventData?.id?.toString() || eventSlug}
        eventTitle={sections?.title || 'Event'}
        eventType={eventData?.eventType || 'upcoming'}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />
      <Hero imageUrl={sections.hero?.heroImage} />

      {/* Heading block aligns with Figma style: title, org, summary list */}
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title,
          description: sections?.hero?.description,
          showExploreAll: false,
          exploreAllHref: '/',
          showOrgName: sections?.organization
        }}
        containerClassName=""
      />

      {sections.banner && (
        <ContentSection
          
          content={sections.banner.description}
          imageUrl={
            getStrapiMediaUrl(sections?.banner?.imageUrl?.url) ||
            getStrapiMediaUrl(sections?.banner?.imageUrl?.url) || FALLBACK_IMAGE
          }
          imagePosition={sections?.banner?.imagePosition || 'left'}
          alignment="center"
          backgroundImage={sections.banner.bg || CONTENTHEADER_BG_IMAGE}
          cta={sections.banner.cta ?? undefined}
        />
      )}

      {sections.textImages && sections.textImages.length === 2 && (
        <TwinContentSection sections={sections.textImages} />
      )}

      {/* Ecosystem carousel from Events page */}
      {sections?.ecosystem && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem?.cards.length}
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
          {sections.ecosystem.cards.map((card: EcosystemCard, idx: number) => (
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

      {/* Contact us footer */}
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

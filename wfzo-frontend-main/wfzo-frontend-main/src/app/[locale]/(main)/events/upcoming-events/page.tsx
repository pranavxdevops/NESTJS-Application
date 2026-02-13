import EventsCard from '@/shared/components/EventsCard';
import transformEventsPage from '@/lib/utils/transformEventsPage';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import GridSection from '@/features/about/components/GridSection';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard, ImageType } from '@/shared/types/globals';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import PastEventsTabs from '@/features/events/components/PastEventsTabs';

function formatRange(start?: string | null, end?: string | null) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e) return `${fmt(s)} - ${fmt(e)}`;
  if (s) return fmt(s);
  return '';
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/upcoming-events';
    return getPageSeo(urlSlug, locale);
}

export default async function UpcomingEventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const urlSlug = '/upcoming-events';
  const nowIso = new Date().toISOString();

  // 1) Page content (hero, ecosystem, contact-us) — no events populate
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=upcoming-events
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
`

  // 2) Events collection filtered in the query (upcoming or ongoing)
  const eventsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events
?filters[$or][0][startDateTime][$gte]=${encodeURIComponent(nowIso)}
&filters[$or][1][endDateTime][$gte]=${encodeURIComponent(nowIso)}
&sort[0]=startDateTime:asc
&populate[cta][populate]=*
&populate[image][populate][image][fields][0]=url
&populate[image][populate][image][fields][1]=formats`;

  const [pageRes, eventsRes] = await Promise.all([
    fetch(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetch(eventsUrl, { next: { revalidate: 300, tags: ['/api/events'] } }),
  ]);

  const [pageJson, eventsJson] = await Promise.all([pageRes.json(), eventsRes.json()]);
  const sections = transformEventsPage(pageJson);

  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: sections.title,
  });

  // Normalize events from collection response
  type NormalizedEvent = {
    title?: string;
    organization?: string;
    location?: string;
    description?: string;
    image?: string;
    startDateTime?: string | null;
    endDateTime?: string | null;
    cta?: { url?: string | null; href?: string | null; title: string | null; targetBlank?: boolean } | null;
    slug?: string;
  };

  const rawEvents: any[] = Array.isArray(eventsJson?.data) ? eventsJson.data : [];
  const events: NormalizedEvent[] = rawEvents
    .map((ev) => {
      const imageUrl = ev?.image?.image?.url
        ? getStrapiMediaUrl(ev.image.image.url)
        : FALLBACK_IMAGE;
      const ctaHref = ev?.cta?.href || ev?.cta?.internalLink?.fullPath || ev?.registrationUrl || null;
      return {
        title: ev?.title || '',
        organization: ev?.organizer || '',
        location: ev?.location || '',
        description: ev?.shortDescription || '',
        image: imageUrl,
        startDateTime: ev?.startDateTime || null,
        endDateTime: ev?.endDateTime || null,
        cta: ev?.cta
          ? { title: ev.cta.title || null, url: ctaHref, href: ctaHref, targetBlank: Boolean(ev.cta.targetBlank) }
          : ctaHref
          ? { title: 'Register', url: ctaHref, href: ctaHref, targetBlank: false }
          : null,
        slug: ev?.slug || '',
      } as NormalizedEvent;
    })
    .filter(Boolean);


  return (
    <div>
      {/* <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      /> */}
      <Hero imageUrl={sections.hero?.heroImage} />

      <div>
        <BreadcrumbContentHeader
          breadcrumbItems={breadcrumbItems}
          contentHeaderProps={{
            header: sections?.hero?.title,
            description: sections?.hero?.description,
            showExploreAll: false,
            exploreAllHref: '/',
          }}
          containerClassName=""
        />
        <PastEventsTabs events={events} isPast={false} />

        {sections.ecosystem && (
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
      </div>
      {sections.contactUs && (
        <ContactSection
          title={sections.contactUs.title}
          description={sections.contactUs.description}
          backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
          cta={sections.contactUs.cta??undefined}
        />
      )}
    </div>
  );
}

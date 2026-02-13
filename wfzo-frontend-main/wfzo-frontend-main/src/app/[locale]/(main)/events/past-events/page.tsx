import transformPastEventsPage from '@/lib/utils/transformPastEventsPage';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import PastEventsTabs, { type NormalizedEvent } from '@/features/events/components/PastEventsTabs';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard, ImageType } from '@/shared/types/globals';

export default async function PastEventsPage() {
  const nowIso = new Date().toISOString();

  // 1) Page content (hero, ecosystem, contact-us) — no events populate
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=past-events
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*`

  // 2) Events collection filtered in the query (past)
  // Past: endDateTime < now OR (endDateTime is null AND startDateTime < now)
  const eventsUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events
?filters[$or][0][endDateTime][$lt]=${encodeURIComponent(nowIso)}
&filters[$or][1][$and][0][endDateTime][$null]=true
&filters[$or][1][$and][1][startDateTime][$lt]=${encodeURIComponent(nowIso)}
&sort[0]=endDateTime:desc
&sort[1]=startDateTime:desc
&populate[cta][populate]=*
&populate[image][populate][image][fields][0]=url
&populate[image][populate][image][fields][1]=formats`;

  const [pageRes, eventsRes] = await Promise.all([
    fetch(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetch(eventsUrl, { next: { revalidate: 21600, tags: ['/api/events'] } }),
  ]);

  const [pageJson, eventsJson] = await Promise.all([pageRes.json(), eventsRes.json()]);
  const sections = transformPastEventsPage(pageJson);

  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: sections.title,
  });

  const rawEvents: any[] = Array.isArray(eventsJson?.data) ? eventsJson.data : [];
  const validEvents: NormalizedEvent[] = rawEvents
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
          ? { title: 'Learn more', url: ctaHref, href: ctaHref, targetBlank: false }
          : null,
        slug: ev?.slug || '',
      } as NormalizedEvent;
    })
    .filter(Boolean);

  const ecosystemCards = sections.ecosystem?.cards ?? [];

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage ?? undefined} />

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

        <PastEventsTabs events={validEvents} />

        {ecosystemCards.length > 0 && (
          <AdvancedCarousel
            itemsCount={ecosystemCards.length}
            title={sections.ecosystem?.title}
            description={sections.ecosystem?.description}
            pageHeading={false}
            visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: 3, xl: 3 }}
            slidesToScroll={1}
            autoplay
            autoplayDelay={5000}
            loop
            showControls
            showProgressBar
            gap={16}
          >
            {ecosystemCards.map((card: EcosystemCard, idx: number) => (
              <div key={idx} className="h-full mb-6">
                <ExploreCard
                  image={
                    card?.backgroundImage?.formats?.medium
                      ? getStrapiMediaUrl(card.backgroundImage.formats.medium)
                      : card?.backgroundImage?.url
                        ? getStrapiMediaUrl(card.backgroundImage.url)
                        : FALLBACK_IMAGE
                  }
                  title={card.title}
                  link={card.link}
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

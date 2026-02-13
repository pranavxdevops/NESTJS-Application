import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import transformEventsPage from '@/lib/utils/transformEventsPage';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';

import PhotoGalleryTabs, { PhotoEvent } from '@/features/events/components/PhotoGalleryTabs';

export default async function PhotoGalleryPage() {
  const base = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL as string;

    const pageUrl = `${base}/api/pages?filters[slug][$eq]=photo-gallery
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats`;

  const mediaUrl = `${base}/api/media-items?populate[0]=mediaFile&populate[1]=event&populate[2]=session&filters[type][$eq]=photo&pagination[pageSize]=1000`;

  const [pageRes, mediaRes] = await Promise.all([
    fetch(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetch(mediaUrl, { next: { revalidate: 21600, tags: ['/api/media-items'] } }),
  ]);

  const [pageJson, mediaJson] = await Promise.all([
    pageRes.json(),
    mediaRes.json()
  ]);

  const sections = transformEventsPage(pageJson);

  const breadcrumbItems = buildBreadcrumbs(
    sections.fullPath,
    { includeHome: true, homeLabel: 'Home', currentLabelOverride: sections.title }
  );

  // Normalize media data
  const events: PhotoEvent[] = (mediaJson?.data ?? []).map(normalizeMediaItem);

  return (
    <div>
      <Hero imageUrl={sections?.hero?.heroImage ?? undefined} />

      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title || 'Photo Gallery',
          description: sections?.hero?.description || '',
          showExploreAll: false,
          exploreAllHref: '/',
        }}
      />

      <PhotoGalleryTabs events={events}/>

      {sections.ecosystem?.cards?.length > 0 && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem?.cards.length}
          title={sections.ecosystem?.title}
          description={sections.ecosystem?.description}
          visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: 3, xl: 3 }}
          slidesToScroll={1}
          autoplay
          autoplayDelay={5000}
          loop
          showControls
          showProgressBar
          gap={16}
        >
          {sections.ecosystem?.cards.map((card: EcosystemCard, idx: number) => (
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

/* ---------------- NORMALIZER ---------------- */

function normalizeMediaItem(item: any): PhotoEvent {
  const type = item.collectionType;
  const media = item.mediaFile?.[0];

  const image =
    media?.formats?.medium?.url ||
    media?.formats?.small?.url ||
    media?.formats?.thumbnail?.url ||
    media?.url
      ? getStrapiMediaUrl(
          media?.formats?.medium?.url ||
            media?.formats?.small?.url ||
            media?.formats?.thumbnail?.url ||
            media?.url
        )
      : FALLBACK_IMAGE;

  // EVENT
  if (type === "event" || type === "events" && item.event) {
    const ev = item.event;
    return {
      type: "event",
      title: ev.title,
      organization: ev.organizer,
      location: ev.location,
      image,
      startDateTime: ev.startDateTime,
      endDateTime: ev.endDateTime,
      slug: ev.slug,
      cardUrl: `/events/past-events/${ev.slug}?tab=photo-gallery`
    };
  }

  // WEBINAR
  if (type === "webinar" && item.webinar) {
    const wb = item.webinar;
    return {
      type: "webinar",
      title: wb.title,
      organization: wb.organizer,
      location: wb.location,
      image,
      startDateTime: wb.startDateTime,
      endDateTime: wb.endDateTime,
      slug: wb.slug,
      cardUrl: `/webinars/${wb.slug}`
    };
  }
   if (type === 'individual' && item.session) {
    const sess = item.session;
    return {
      type: 'individual',
      title: sess.title || item.title || 'Untitled Video',
      organization: sess.organizer || item.organizer || '',
      location: sess.location || item.location || '',
      image,
      startDateTime: sess.startDate || item.startDate || null,
      endDateTime: sess.endDateTime || null,
      slug: sess.slug,
      cardUrl: `/events/photo-gallery/${sess.slug}?tab=photo-gallery`,
    };
  }

  // INDIVIDUAL
  return {
    type: "individual",
    title: item.title ?? "Untitled",
    organization: item.organizer ?? "",
    location: item.location ?? "",
    image,
    startDateTime: item.startDate,
    endDateTime: null,
    slug: undefined,
    cardUrl: `/photo-gallery/${item.documentId}`
  };
}

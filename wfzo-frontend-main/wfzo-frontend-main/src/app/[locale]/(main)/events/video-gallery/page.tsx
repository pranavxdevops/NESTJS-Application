import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import transformEventsPage from '@/lib/utils/transformEventsPage';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import VideoGalleryTabs, { VideoEvent } from '@/features/events/components/VideoGalleryTabs';

const FALLBACK_YOUTUBE_THUMB = 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : FALLBACK_YOUTUBE_THUMB;
}

// Normalizer defined right here — no extra file needed
function normalizeVideoItem(item: any): VideoEvent {
  const videoFiles = item.videoMediaFile || [];
  const firstVideoHref = videoFiles[0]?.videohref;
  const thumbnail = firstVideoHref ? getYouTubeThumbnail(firstVideoHref) : FALLBACK_IMAGE;

  const videoUrls = videoFiles
    .map((v: any) => v.videohref)
    .filter(Boolean);

  const collectionType = item.collectionType;

  // Event-based video
  if ((collectionType === 'events' || collectionType === 'event') && item.event) {
    const ev = item.event;
    return {
      type: 'event',
      title: ev.title,
      organization: ev.organizer || '',
      location: ev.location || '',
      thumbnail,
      startDateTime: ev.startDateTime,
      endDateTime: ev.endDateTime,
      slug: ev.slug,
      cardUrl: `/events/past-events/${ev.slug}?tab=video-gallery`,
    };
  }

  // Webinar-based video (if you have it later)
  if (collectionType === 'webinars' && item.webinar) {
    const wb = item.webinar;
    return {
      type: 'webinar',
      title: wb.title,
      organization: wb.organizer || '',
      location: wb.location || '',
      thumbnail,
      startDateTime: wb.startDateTime,
      endDateTime: wb.endDateTime,
      slug: wb.slug,
      cardUrl: `/webinars/${wb.slug}`,

    };
  }
  if (collectionType === 'individual' && item.session) {
    const sess = item.session;
    return {
      type: 'individual',
      title: sess.title || item.title || 'Untitled Video',
      organization: sess.organizer || item.organizer || '',
      location: sess.location || item.location || '',
      thumbnail,
      startDateTime: sess.startDate || item.startDate || null,
      endDateTime: sess.endDateTime || null,
      slug: sess.slug,
      cardUrl: `/events/video-gallery/${sess.slug}?tab=video-gallery`,
    };
  }

  // Individual video
  return {
    type: 'individual',
    title: item.title || 'Untitled Video',
    organization: item.organizer || '',
    location: item.location || '',
    thumbnail,
    startDateTime: item.startDate || null,
    endDateTime: null,
    slug: undefined,
    cardUrl: `/events/video-gallery/${item.documentId}`,

  };
}

export default async function VideoGalleryPage() {
  const base = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL as string;

  const pageUrl = `${base}/api/pages?filters[slug][$eq]=video-gallery&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats`;

  const mediaUrl = `${base}/api/media-items?populate[0]=videoMediaFile&populate[1]=event&populate[2]=session&filters[type][$eq]=video&pagination[pageSize]=1000`;

  const [pageRes, mediaRes] = await Promise.all([
    fetch(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetch(mediaUrl, { next: { revalidate: 21600, tags: ['/api/media-items'] } }),
  ]);

  if (!pageRes.ok || !mediaRes.ok) {
    return <div>Error loading page</div>;
  }
  const [pageJson, mediaJson] = await Promise.all([pageRes.json(), mediaRes.json()]);

  const sections = transformEventsPage(pageJson);
  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: sections.title || 'Video Gallery',
  });

  // Normalize right here
  const videos: VideoEvent[] = (mediaJson?.data ?? []).map(normalizeVideoItem);

  return (
    <div>
      <Hero imageUrl={sections?.hero?.heroImage ?? undefined} />
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title || 'Video Gallery',
          description: sections?.hero?.description || '',
          showExploreAll: false,
        }}
      />

      <VideoGalleryTabs events={videos} />

      {/* Ecosystem Carousel */}
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
                    ? card.backgroundImage.formats.medium
                    : card?.backgroundImage?.url || FALLBACK_IMAGE
                }
                title={card.title}
                link={card.link}
              />
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {/* Contact Section */}
      {sections.contactUs && (
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
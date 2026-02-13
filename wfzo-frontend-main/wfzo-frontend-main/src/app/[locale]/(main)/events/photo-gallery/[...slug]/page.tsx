import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import ContentSection from '@/shared/components/ContentSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import PastEventResourcesTab from '@/features/events/components/PastEventResourcesTab';
import transformEventDetailPage from '@/lib/utils/transformEventDetailPage';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { EcosystemCard } from '@/shared/types/globals';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

type PageProps = {
  params: Promise<{ slug: string[]; locale: string }>;
};

export default async function PhotoGalleryIndividualDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing gallery slug</div>;
  }

  const gallerySlug = Array.isArray(slug) ? slug[0] : slug;

  // Fetch videos for the gallery category
  const eventUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/sessions?filters[slug][$eq]=${encodeURIComponent(
    gallerySlug
  )}&populate[image][populate][image][fields][0]=url&populate[media_items][populate][mediaFile][fields][0]=url&populate[media_items][populate][videoMediaFile][populate]=*`;

  // Fetch extra dynamic data
  const extrasUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=photo-gallery&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url`;

  const eventRes = await fetch(eventUrl, {
    next: { revalidate: 21600, tags: ['/api/video-gallery'] },
  });
  const extraRes = await fetch(extrasUrl, {
    next: { revalidate: 21600, tags: ['/api/video-gallery-extras'] },
  });

  if (!eventRes.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error loading videos</div>;
  }

  const eventJson = await eventRes.json();
  const extraJson = await extraRes.json();

  // Transform to the same structure as past events
  const sections = transformEventDetailPage(eventJson, extraJson);
  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
      includeHome: true,
      homeLabel: 'Home',
      trailingItem: {
        label: sections.title
      },
    });
  return (
    <div>
      {/* Hero Section */}
      <Hero imageUrl={sections.hero?.heroImage} />

      {/* Page Header */}
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title,
          description: sections?.hero?.description,
          showExploreAll: false,
          exploreAllHref: '/',
        }}
      />

      {/* VIDEO LISTING — Uses the same tab component from past events */}
      {(sections?.photoResources?.length > 0) && (
        <div className="px-5 md:px-30 py-10 md:py-20">
          <PastEventResourcesTab
            photoResources={sections?.photoResources || []}
             hideTabsAndTitle={true}
          />
        </div>
      )}

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

      {/* Contact Us */}
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

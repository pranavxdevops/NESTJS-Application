import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import ContentSection from '@/shared/components/ContentSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { EventTracker } from '@/shared/components/tracking/EventTracker';
// import ScrollableTabs from '@/shared/components/ScrollableTabs';
// import transformPastEventDetailPage from '@/lib/utils/transformPastEventDetailPage';
import PastEventResourcesTab from '@/features/events/components/PastEventResourcesTab';
import transformPastEventDetailPage from '@/lib/utils/transformPastEventDetailPage';
import transformEventDetailPage from '@/lib/utils/transformEventDetailPage';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export default async function PastEventDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;


  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing event slug</div>;
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/events?filters[slug][$eq]=${encodeURIComponent(slug)}
&populate[cta][populate]=*
&populate[image][populate][image][fields][0]=url
&populate[event_details][populate][image][populate][image][fields][0]=url
&populate[media_items][populate][mediaFile][fields]=url
&populate[media_items][populate][videoMediaFile][populate]=*
`;
  const extrasUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=past-events&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url`;

  const eventRes = await fetch(eventUrl, { next: { revalidate: 21600, tags: ['/api/events'] } });
  
  const extraRes = await fetch(extrasUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } });
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

  return (
    <div>
      <EventTracker 
        eventId={slug} 
        eventTitle={sections?.title || slug}
        eventType="past-event"
      />
      <Hero imageUrl={sections.hero?.heroImage} />

      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title,
          // subheader: sections?.hero?.organization,
          description: sections?.hero?.description,
          showExploreAll: false,
          exploreAllHref: '/',
        }}
        containerClassName=""
      />

      {sections.banner && (
              <ContentSection
                
                content={sections.banner.description}
                imageUrl={
                  getStrapiMediaUrl(sections?.banner?.imageUrl?.url) || FALLBACK_IMAGE
                }
                imagePosition={sections?.banner?.imagePosition || 'left'}
                alignment="center"
                backgroundImage={sections.banner.bg || CONTENTHEADER_BG_IMAGE}
                
              />
            )}
      

      {(sections?.videoResources?.length !== 0 || sections?.photoResources?.length !== 0 )&& <div className="px-5 md:px-30 py-10 md:py-20">
        <PastEventResourcesTab
          videoResources={sections?.videoResources || []}
          photoResources={sections?.photoResources || []}
          // documentResources={sections?.documentResources || []}
        />
      </div>}

     
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

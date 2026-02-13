import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import AtlasMap from '@/features/knowledge/components/AtlasMap';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import ContentSection from '@/shared/components/ContentSection';
import transformBeAFeaturedMember from '@/lib/utils/transformBeAFeaturedMember';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ContactSection from '@/shared/components/ContactSection';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import ExploreCard from '@/shared/components/ExploreCard';
import Hero from '@/features/about/components/Hero';
import { getPageBySlug } from '@/lib/api/getPageBySlug';
import AtlasContentWrapper from './AtlasContentWrapper';

export default async function AtlasPage() {
 
  // ✅ Use cached reusable function
  const json = await getPageBySlug("atlas");
  console.log("json", json);
  

  // ✅ Safer error handling for cached fetch
  if (!json?.data?.length) {
    return (
      <div className="min-h-screen bg-wfzo-gold-25">
        <div className="px-5 md:px-30 py-10">
          <p className="text-wfzo-grey-900">
            Error: Failed to fetch page data
          </p>
        </div>
      </div>
    );
  }


    const sections = transformBeAFeaturedMember(json) || {};
    const heroImage = sections.hero?.heroImage || FALLBACK_IMAGE;
  
     // Extract banner data
    // Extract banner data
    let bannerImageUrl = FALLBACK_IMAGE;
    if (sections.banner?.imageUrl) {
      // transformImage returns an object with url and formats
      const imageData = sections.banner.imageUrl;
      if (imageData.formats?.large) {
        bannerImageUrl = getStrapiMediaUrl(imageData.formats.large);
      } else if (imageData.url) {
        bannerImageUrl = getStrapiMediaUrl(imageData.url);
      }
    }
    const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: sections.title,
  });

  return (
    <div className="min-h-screen bg-wfzo-gold-25">

      {/* Hero Section */}
      <Hero imageUrl={sections.hero?.heroImage} />
      
      {/* Main Content with Restriction */}
      <AtlasContentWrapper>
        <div className="px-5 md:px-30 py-10">
          {/* Back Button */}
        

          {/* Breadcrumb and Content Header */}
          <BreadcrumbContentHeader
            breadcrumbItems={breadcrumbItems}
            contentHeaderProps={{
              header: 'Atlas',
              description: 'Discover Freezones that are part of our member community. Browse locations, view details, and join us to unlock more features and opportunities.',
              showExploreAll: false,
              exploreAllHref: '/',
            }}
            containerClassName="px-0! pt-0!"
          />

        {/* Warning Banner */}
        <div className="flex flex-col items-start gap-1 p-4 rounded-xl border border-[#F3DA91] bg-[#FDF9ED] mb-6">
          <div className="flex items-center gap-4 w-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17C12.2833 17 12.5208 16.9042 12.7125 16.7125C12.9042 16.5208 13 16.2833 13 16V12C13 11.7167 12.9042 11.4792 12.7125 11.2875C12.5208 11.0958 12.2833 11 12 11C11.7167 11 11.4792 11.0958 11.2875 11.2875C11.0958 11.4792 11 11.7167 11 12V16C11 16.2833 11.0958 16.5208 11.2875 16.7125C11.4792 16.9042 11.7167 17 12 17ZM12 9C12.2833 9 12.5208 8.90417 12.7125 8.7125C12.9042 8.52083 13 8.28333 13 8C13 7.71667 12.9042 7.47917 12.7125 7.2875C12.5208 7.09583 12.2833 7 12 7C11.7167 7 11.4792 7.09583 11.2875 7.2875C11.0958 7.47917 11 7.71667 11 8C11 8.28333 11.0958 8.52083 11.2875 8.7125C11.4792 8.90417 11.7167 9 12 9ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#D6B85C"/>
            </svg>
            <h3 className="flex-1 text-[#333] font-source text-base font-bold leading-5">
              Page under construction
            </h3>
          </div>
          <div className="pl-10">
            <p className="text-wfzo-grey-700 font-source text-base font-normal leading-6">
              We’re actively working on this Atlas page. Member Freezone data may be partial and will be updated shortly.
            </p>
          </div>
        </div>

        {/* Atlas Map Component */}
        <AtlasMap />
         {sections.banner?.description && (
                <ContentSection
                     content={sections.banner.description}
                     imageUrl={bannerImageUrl}
                     imagePosition={sections.banner.imagePosition || "left"}
                     alignment="center"
                     backgroundImage={sections.banner.bg}
                     variant="gold"
                     innerClass='px-0!'
                   />
                 )}

                        
      </div>
      </AtlasContentWrapper>
      
      {sections.ecosystem && (
         <AdvancedCarousel
             itemsCount={sections.ecosystem?.cards.length}
              title={sections.ecosystem.title}
              description={sections.ecosystem.description}
              pageHeading={false}
              // headerCta={cta}
              visibleSlides={{
                xs: 1.2, // 1 card on mobile
                sm: 2, // 2 cards on small tablets
                md: 2, // 3 cards on tablets
                lg: 3, // 4 cards on desktop
                xl: 3, // 4 cards on large desktop
              }}
              slidesToScroll={1} // Scroll 1 card at a time
              autoplay={true}
              autoplayDelay={5000}
              loop={true}
              showControls={true}
              showProgressBar={true}
              gap={16} // 16px gap between cards
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

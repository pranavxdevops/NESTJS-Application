import ContentSection from '@/shared/components/ContentSection';
import FeaturedMemberFormWrapper from '@/shared/components/FeaturedMemberFormWrapper';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import transformBeAFeaturedMember from '@/lib/utils/transformBeAFeaturedMember';
import AuthConditionalSection from '@/shared/components/AuthConditionalSection';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import Image from 'next/image';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import VideoFAQSectionsWrapper from '@/features/knowledge/components/VideoFAQSectionsWrapper';
import Hero from '@/features/about/components/Hero';
import { getPageBySlug } from '@/lib/api/getPageBySlug';

export default async function AskAnExpertPage() {

 // ✅ Use cached reusable function
  const json = await getPageBySlug("ask-an-expert");

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

  // Extract hero image
  const heroImage = sections.hero?.heroImage || FALLBACK_IMAGE;

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
      <Hero imageUrl={heroImage} />

      

      {/* Main Content */}
      <div className="px-5 md:px-30 py-10">
        {/* Back Button */}
        {/* <BackButton className="mb-6" /> */}

      {/* Breadcrumb and Content Header */}
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title,
          description: sections?.hero?.description,
          showExploreAll: false,
          exploreAllHref: '/',
        }}
        containerClassName="px-0! pt-0!"
      />

        {/* Content Section with Image and Description */}
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

        {/* Form Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Heading and Image */}
            <div className="flex flex-col gap-8">
              <h2 className="font-montserrat text-[40px] md:text-[60px] leading-[48px] md:leading-[80px] font-black text-wfzo-grey-900">
                Contact Us
              </h2>
              <p className="font-source leading-relaxed text-gray-700 max-w-2xl">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
              <div className="w-full rounded-[16px] overflow-hidden relative">
                <Image
                  src="https://api.builder.io/api/v1/image/assets/TEMP/6c5a89f26e0ac631e1f91eee6cd13424d21a3bd4?width=1168"
                  alt="Ask an expert"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full">
              <FeaturedMemberFormWrapper enquiryType="submit_question" />
            </div>
          </div>
        </div>
      <VideoFAQSectionsWrapper videoFaqSections={sections.expertInsights ? [sections.expertInsights] : undefined} />
      </div>

        <AuthConditionalSection>
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
        </AuthConditionalSection>
    </div>
  );
}

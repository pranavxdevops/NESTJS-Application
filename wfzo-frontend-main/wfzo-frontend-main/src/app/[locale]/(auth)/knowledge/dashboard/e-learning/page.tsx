import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import ContentSection from '@/shared/components/ContentSection';
import FeaturedMemberFormWrapper from '@/shared/components/FeaturedMemberFormWrapper';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import transformBeAFeaturedMember from '@/lib/utils/transformBeAFeaturedMember';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import Image from 'next/image';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import AuthConditionalSection from '@/shared/components/AuthConditionalSection';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ElearningPage() {

  // Fetch page data from Strapi filtered by slug
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=e-learning&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats
  &populate[contents][on][home.ecosystem][populate][cards][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
  &populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][cta][populate]=*`;

  const res = await fetch(pageUrl);

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-wfzo-gold-25">
        <div className="px-5 md:px-30 py-10">
          <p className="text-wfzo-grey-900">Error: Failed to fetch page data</p>
        </div>
      </div>
    );
  }

  const json = await res.json();
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
    includeHome: false,
    homeLabel: 'Home',
    currentLabelOverride: sections.title,
  });

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Section */}
      <HeroAuth backgroundImage={heroImage} />

      

      {/* Main Content */}
      <div className="px-5 md:px-30 py-10">
        {/* Back Button */}
        <Link 
          href="/knowledge/dashboard"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

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
            cta={{ title: 'Go to E-Learning', url: 'https://worldfreezone-dev.isorobot.io/', targetBlank: true, variant: 'gold' }}
          />
        )}

        {/* Form Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Heading and Image */}
            <div className="flex flex-col gap-8">
              <h2 className="font-montserrat text-[40px] md:text-[60px] leading-[48px] md:leading-[80px] font-black text-wfzo-grey-900">
                E-learning
              </h2>
              <div className="w-full rounded-[16px] overflow-hidden relative">
                <Image
                  src="https://api.builder.io/api/v1/image/assets/TEMP/6c5a89f26e0ac631e1f91eee6cd13424d21a3bd4?width=1168"
                  alt="E-learning"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full">
              <FeaturedMemberFormWrapper enquiryType="learn_more" />
            </div>
          </div>
        </div>
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
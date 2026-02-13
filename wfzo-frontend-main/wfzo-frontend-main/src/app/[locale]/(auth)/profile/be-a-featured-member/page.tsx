import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import ContentSection from '@/shared/components/ContentSection';
import FeaturedMemberFormWrapper from '@/shared/components/FeaturedMemberFormWrapper';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import transformBeAFeaturedMember from '@/lib/utils/transformBeAFeaturedMember';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BeAFeaturedMemberPage() {

  
  // Fetch page data from Strapi filtered by slug
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=be-a-featured-member&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats`;
  
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
          href="/profile"
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
          />
        )}

        {/* Form Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Heading and Image */}
            <div className="flex flex-col gap-8">
              <h2 className="font-montserrat text-[40px] md:text-[60px] leading-[48px] md:leading-[80px] font-black text-wfzo-grey-900">
                Request to be a Featured Member
              </h2>
              <div className="w-full rounded-[16px] overflow-hidden relative">
                <Image
                  src="https://api.builder.io/api/v1/image/assets/TEMP/6c5a89f26e0ac631e1f91eee6cd13424d21a3bd4?width=1168"
                  alt="Featured member"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full">
              <FeaturedMemberFormWrapper enquiryType="become_featured_member" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import ContentSection from '@/shared/components/ContentSection';
import ContactSection from '@/shared/components/ContactSection';
import transformAboutUsHistory from '@/lib/utils/transformAboutUsOurHistory';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import FoundingMemberCard from '@/features/about/components/FoundingMemberCard';
import Hero from '@/features/about/components/Hero';
import ExploreCard from '@/shared/components/ExploreCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import TwinContentSection from "@/features/membership/components/TwinContentSection";
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from "@/lib/constants/constants";
import { buildBreadcrumbs } from "@/lib/utils/buildBreadcrumbs";
import { getStrapiMediaUrl } from "@/lib/utils/getMediaUrl";
import { generateSeo } from "@/lib/utils/seo/generateSeo";
import { getPageSeo } from "@/lib/utils/seo/fetchSeo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/our-history';
    return getPageSeo(urlSlug, locale);
}

export default async function OurHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const urlSlug = '/our-history';
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=our-history&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][sections.text-image][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.text-image][populate][image][populate][image][fields][1]=formats&populate[contents][on][sections.media-banner][populate]=*&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][sections.member-card][populate]=title&populate[contents][on][sections.member-card][populate][members][populate][fields][0]=name&populate[contents][on][sections.member-card][populate][members][populate][fields][1]=role&populate[contents][on][sections.member-card][populate][members][populate][fields][2]=slug&populate[contents][on][sections.member-card][populate][members][populate][image][populate][image][fields][0]=url&populate[contents][on][sections.member-card][populate][members][populate][image][populate][image][fields][1]=formats&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats&locale=${locale}&populate[seo][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/our-history'] } }
  );
  if (!res.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }
  const json = await res.json();
  const sections = transformAboutUsHistory(json) || {};
  const seo = generateSeo(json?.data?.[0]?.seo, locale, urlSlug);

  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
       includeHome: true,
       homeLabel: 'Home',
       currentLabelOverride: sections.title,
     });

  return (
    <div>
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />
      <Hero imageUrl={sections.hero?.heroImage} />

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

      {sections.banner && (
        <ContentSection
          title={sections.banner.title}
          content={sections.banner.description}
          imageUrl={getStrapiMediaUrl(sections?.banner?.imageUrl?.formats?.large) || getStrapiMediaUrl(sections?.banner?.imageUrl?.url)}
          imagePosition={sections?.banner?.position || "left"}
          alignment="center"
          backgroundImage={
            sections.banner.bg ||
            CONTENTHEADER_BG_IMAGE
          }
        />

      )}
      <div>
  
          {sections.textImages && sections.textImages.length === 2 && (
            <TwinContentSection sections={sections.textImages} />
           )}
        {sections.mediaBanner && (
          <div
            className="mx-5 md:mx-30 h-[170px] lg:h-[568px] rounded-[20px] lg:rounded-[40px] lg:mt-20 mt-10 mb-0 relative overflow-hidden"
          >
            <Image
              src={sections.mediaBanner.imageUrl}
              alt="Banner"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
        )}

        {/* advanced carousal component for founding member section */}
        {sections.memberCard && (
          <AdvancedCarousel
            itemsCount={sections.memberCard.members.length}
            title={sections.memberCard.title}
            description={sections.memberCard.description}
            // headerCta={cta}
            visibleSlides={{
              xs: 1.2, // 1 card on mobile
              sm: 2, // 2 cards on small tablets
              md: 2, // 3 cards on tablets
              lg: 3, // 3 cards on desktop
              xl: 3, // 4 cards on large desktop
            }}
            slidesToScroll={1} // Scroll 1 card at a time
            autoplay={true}
            autoplayDelay={5000}
            loop={true}
            showControls={true}
            showProgressBar={true}
            gap={12} // 16px gap between cards
          >
            {sections.memberCard.members.map((member: any) => (
              <div key={member.id} className="h-full mb-6">
                <FoundingMemberCard
                  name={member.name}
                  role={member.role || ''}
                  bio={member.biodata || ''}
                  imageUrl={getStrapiMediaUrl(member.imageUrl?.formats?.large) || getStrapiMediaUrl(member.imageUrl?.url)}
                  linkedinUrl={member.linkedinUrl}
                  description={member.description}
                />
              </div>
            ))}
          </AdvancedCarousel>
        )}

        {/* advanced carousal component for explore about(ecosystem) section */}
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



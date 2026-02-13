import ExploreCard from '@/shared/components/ExploreCard';
import Hero from '@/features/about/components/Hero';
import PartnersSection from '@/features/home/components/PartnersSection';
import { getAppPublicImages, getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import React from 'react';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import transformMemberPartner from '@/lib/utils/transformMemberPartnerPage';
import ContactSection from '@/shared/components/ContactSection';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/partners-and-sponsors';
    return getPageSeo(urlSlug, locale);
}
const page = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    const urlSlug = '/partners-and-sponsors';
   const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=partners-and-sponsors
&populate=*
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.about-summary][populate][statistics][populate]=*
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*
&populate[contents][on][sections.testimonials][populate][testimonial][populate]=*
&populate[contents][on][home.featured-member][populate][cta][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/partners-and-sponsors'] } }
  );
  if (!res.ok) {
    return <div className="w-[80%] mx-auto py-20">Error: Failed to fetch page data</div>;
  }
    const json = await res.json();
    const sections = transformMemberPartner(json) || {};
    const seo = generateSeo(json?.data?.seo, locale, urlSlug);

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
      <PartnersSection title="Our Partners" />

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
                                 title={card.title} 
                                 link={card.link} />
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
};

export default page;

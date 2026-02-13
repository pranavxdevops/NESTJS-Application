import FAQSection from '@/features/about/components/FAQSection';
import InfoSection from '@/features/about/components/FormSection';
import ContactSection from '@/shared/components/ContactSection';
import React from 'react';
import transformFaqPage from '@/lib/utils/transformFaqPage';
import Hero from '@/features/about/components/Hero';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import FAQSectionsWrapper from '@/features/about/components/FAQSectionsWrapper';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/faq';
    return getPageSeo(urlSlug, locale);
}
export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const urlSlug = '/faq';
  // Fetch data on the server
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=faq&populate=*
&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title
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
&populate[contents][on][shared.faq-block][populate]=*
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*
&populate[seo][populate]=*
`,
    { next: { revalidate: 21600, tags: ['/api/faq'] } }
  );
  if (!res.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }
  const json = await res.json();
  const sections = transformFaqPage(json) || {};
  const seo = generateSeo(json?.data?.[0]?.seo, locale, urlSlug);

 const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
     includeHome: true,
     homeLabel: 'Home',
     currentLabelOverride: sections.title,
   });

  const combinedFaqSections = [
  ...(Array.isArray(sections.wfzoFaqSections) ? sections.wfzoFaqSections : []),
  ...(Array.isArray(sections.membershipFaqSections) ? sections.membershipFaqSections : []),
];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />
      <Hero imageUrl={sections.hero?.imageUrl} />
      <div>
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
        <div className="px-5 md:px-30 py-10 md:py-20">
          <div className="">
            <FAQSectionsWrapper faqSections={combinedFaqSections} />
          </div>
        </div>
        <InfoSection
          title={sections.contactBlock.title || 'Still have questions?'}
          description={sections.contactBlock.description || 'Feel free to reach out to us!'}
          image={
            sections.contactBlock?.imageUrl?.formats?.large
            ? getStrapiMediaUrl(sections.contactBlock.imageUrl.formats.large)
            : sections?.contactBlock?.imageUrl?.url
            ? getStrapiMediaUrl(sections.contactBlock.imageUrl.url)
            : FALLBACK_IMAGE
          }  
        />


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
                    {sections.ecosystem.cards.map((card:any, idx: number) => (
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

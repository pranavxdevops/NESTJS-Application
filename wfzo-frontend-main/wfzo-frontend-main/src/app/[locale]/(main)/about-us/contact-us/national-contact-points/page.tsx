import ContactCard from '@/features/about/components/ContactCard';
import ContentSection from '@/shared/components/ContentSection';
import ExploreCard from '@/shared/components/ExploreCard';
import InfoSection from '@/features/about/components/FormSection';
import GridSection from '@/features/about/components/GridSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ContactSection from '@/shared/components/ContactSection';
import transformNcpMainPage from '@/lib/utils/transformNcpMainPage';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Hero from '@/features/about/components/Hero';
import React from 'react';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';


interface Office {
  id: number;
title?: string;
  slug?: string;
  fullPath?: string;
  [key: string]: any; // optional fallback for other Strapi fields
}


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/national-contact-points';
    return getPageSeo(urlSlug, locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/national-contact-points';
    const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=national-contact-points&populate=*
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
&populate[contents][on][sections.text-image][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.text-image][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*
&populate[contents][on][home.featured-member][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/national-contact-points'] } }
  );


  const allOfficesUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/offices
?populate[officeSecondLevelText][populate][image][populate][image]=true
&populate[image][populate][image]=true
&populate[bannersection][populate][backgroundImage][populate][image]=true
&populate[bannersection][populate][image][populate][image]=true
&locale=en`;

const allOfficesRes = await fetch(allOfficesUrl, {
  next: { revalidate: 21600, tags: [`/api/office`] },
});
const allOfficesJson = await allOfficesRes.json();
const allOffices: Office[] = allOfficesJson?.data || [];


  if (!res.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }

  const json = await res.json();
  const sections = transformNcpMainPage(json,allOffices) || {};
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

        {sections.nationalContactPointCards &&
            sections.nationalContactPointCards.map((nationalSection: any, index: any) => (
              <GridSection
                key={index}
                heading={nationalSection.title}
                members={nationalSection.offices}
                CardComponent={ContactCard}
                items={4}
              />
            ))}




       {sections.regionalOfficeCards && sections.featuredMember && (
  sections.regionalOfficeCards.map((card: any, idx: any) => (
    <AdvancedCarousel
      key={`ncpCard-${idx}`}
      itemsCount={card.offices.length}
      title={sections.featuredMember?.title || card.title || 'Regional Offices'}
      description={sections.featuredMember?.description || card.description || 'Description'}
      pageHeading={false}
      showExploreAll={true}
      exploreAllHref="/about-us/contact-us/regional-offices"
      visibleSlides={{
        xs: 1.2,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
      }}
      slidesToScroll={1}
      autoplay={true}
      autoplayDelay={5000}
      loop={true}
      showControls={true}
      showProgressBar={true}
      gap={12}
    >
      {(card.offices ?? []).map((office: any, idx: number) => (
        <div key={idx} className="h-full mb-6">
          <ContactCard {...office} />
        </div>
      ))}
    </AdvancedCarousel>
  ))
)}

        {sections.contactBlock && (
          <InfoSection
            title={sections.contactBlock.title}
            description={sections.contactBlock.description}
            image={
              sections.contactBlock?.imageUrl?.formats?.large
              ? getStrapiMediaUrl(sections.contactBlock.imageUrl.formats.large)
              : sections?.contactBlock?.imageUrl?.url
              ? getStrapiMediaUrl(sections.contactBlock.imageUrl.url)
              : FALLBACK_IMAGE
          }  
          />
        )}
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
 
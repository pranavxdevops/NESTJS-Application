// ...existing imports...
import Image from 'next/image';
import FeaturedMemberFormWrapper from '@/shared/components/FeaturedMemberFormWrapper';
import ContactInfoCard from '@/shared/components/ContactInfoCard';
import ContactSection from '@/shared/components/ContactSection';
import InfoSection from '@/features/about/components/FormSection';
import transformContactUsPage from '@/lib/utils/transformContactUsPage';
import ExploreCard from '@/shared/components/ExploreCard';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ContactCard from '@/features/about/components/ContactCard';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';


async function fetchJson(url: string, options: { next: { revalidate: number; tags: string[] } }) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/contact-us';
    return getPageSeo(urlSlug, locale);
}

export default async function ContactUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const urlSlug = '/contact-us';
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  const pageUrl = `${baseUrl}/api/pages?filters[slug][$eq]=contact-us&populate=*
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
&populate[contents][on][sections.contact-information-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.contact-information-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][sections.contact-information-block][populate][contactData][populate]=*
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*`;

  const officesUrl = `${baseUrl}/api/offices?populate[image][populate][image]=true&populate[officeSecondLevelText][populate][image][populate][image]=true&locale=en`;

  try {
    const [pageJson, officesJson] = await Promise.all([
      fetchJson(pageUrl, { next: { revalidate: 21600, tags: ['/api/contact-us'] } }),
      fetchJson(officesUrl, { next: { revalidate: 21600, tags: ['/api/office'] } }),
    ]);

    const offices = officesJson?.data || [];
    const sections = transformContactUsPage(pageJson, offices) || {};
    const seo = generateSeo(pageJson?.data?.[0]?.seo, locale, urlSlug);

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
        <ContactInfoCard
          image={
            sections.contactInfo?.image?.formats?.large?.url
              ? getStrapiMediaUrl(sections.contactInfo.image.formats.large.url)
              : sections.contactInfo?.image?.url
              ? getStrapiMediaUrl(sections.contactInfo.image.url)
              : FALLBACK_IMAGE
          }
          alt={sections.contactInfo?.image?.alt || 'Contact image'}
          sections={sections.contactInfo?.sections || []}
        />

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

        <div>
          {(sections.roCards || []).map((card: any, idx: any) => (
            <AdvancedCarousel
              key={`roCard-${idx}`}
              itemsCount={card.offices.length}
              title={card.title || 'Regional Offices'}
              description={card.description || 'Description'}
              pageHeading={false}
              showExploreAll={true}
              exploreAllHref={`${sections.fullPath}/${card.title?.toLowerCase().replace(/\s+/g, '-')}`}
              // headerCta={cta}
              visibleSlides={{
                xs: 1.2, // 1 card on mobile
                sm: 2, // 2 cards on small tablets
                md: 2, // 3 cards on tablets
                lg: 3, // 4 cards on desktop
                xl: 4, // 4 cards on large desktop
              }}
              slidesToScroll={1} // Scroll 1 card at a time
              autoplay={true}
              autoplayDelay={5000}
              loop={true}
              showControls={true}
              showProgressBar={true}
              gap={12} // 16px gap between cards
            >
              {card.offices.map((office: any, idx: number) => (
                <div key={idx} className="h-full mb-6">
                  <ContactCard {...office} fullPath={`${sections.fullPath}/${card.title?.toLowerCase().replace(/\s+/g, '-')}/${office.slug}`}
 />
                </div>
              ))}
            </AdvancedCarousel>
          ))}
        </div>
        <div>
          {(sections.ncpCards || []).map((card: any, idx: any) => (
            <AdvancedCarousel
              key={`ncpCard-${idx}`}
              itemsCount={card.offices.length}
              title={card.title || 'Regional Offices'}
              description={card.description || 'Description'}
              pageHeading={false}
              showExploreAll={true}
              exploreAllHref={`${sections.fullPath}/${card.title?.toLowerCase().replace(/\s+/g, '-')}`}
              // headerCta={cta}
              visibleSlides={{
                xs: 1.2, // 1 card on mobile
                sm: 2, // 2 cards on small tablets
                md: 2, // 3 cards on tablets
                lg: 3, // 4 cards on desktop
                xl: 4, // 4 cards on large desktop
              }}
              slidesToScroll={1} // Scroll 1 card at a time
              autoplay={true}
              autoplayDelay={5000}
              loop={true}
              showControls={true}
              showProgressBar={true}
              gap={12} // 16px gap between cards
            >
              {card.offices.map((office: any, idx: number) => (
                <div key={idx} className="h-full mb-6">
                  <ContactCard {...office} fullPath={`${sections.fullPath}/${card.title?.toLowerCase().replace(/\s+/g, '-')}/${office.slug}`}
  />
                </div>
              ))}
            </AdvancedCarousel>
          ))}
        </div>

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
  } catch (error) {
    console.error('Error fetching contact-us page data:', error);
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }
}

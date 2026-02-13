import { Breadcrumb } from '@/shared/components/Breadcrumb';
import ExploreCard from '@/shared/components/ExploreCard';
import Hero from '@/features/about/components/Hero';
import ContentHeader from '@/shared/components/ContentHeader';
import BenefitsSection from '@/features/membership/components/BenefitsSection';
import JoinFormSection from '@/features/membership/components/JoinFormSection';
import MembershipTypesSection from '@/features/membership/components/MembershipTypesSection';
import MembersWorldwideLeaflet from '@/features/membership/components/MembersWorldwideLeaflet';
import TestimonialCard from '@/features/membership/components/TestimonialCard';
import MemberShipDetailsSection from '@/features/membership/components/VotingMemberDetails';
import transformBecomeMemberPage from '@/lib/utils/transformBecomeMemberPage';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import SelectedMembershipType from '@/features/membership/SelectedMemberType';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/become-a-member';
    return ;//getPageSeo(urlSlug, locale);
}
export default async function Index({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/become-a-member';
  // Fetch data on the server
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=become-a-member&populate=*
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
&populate[contents][on][sections.testimonials][populate][testimonial][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/become-a-member'] } }
  );
  if (!res.ok) {
    return <div className="w-[80%] mx-auto py-20">Error: Failed to fetch page data</div>;
  }
  const json = await res.json();
  const sections = transformBecomeMemberPage(json) || {};
  //const seo = generateSeo(json?.data?.seo, locale, urlSlug);
  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
      includeHome: true,
      homeLabel: 'Home',
      currentLabelOverride: sections.title,
  });

  return (
    <div>
      {/*<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />*/}
      {/* Main Content */}
      <Hero imageUrl={sections.hero?.heroImage} />
      <main>
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
          <BenefitsSection
            benefits={sections.memberSummary[0]?.benefits}
            title={sections.memberSummary[0]?.title}
          />
          <div className='py-10 md:pb-20'>
          <div className="px-5 md:px-30">
            <ContentHeader
              header={sections.extraHeroes[0]?.title || 'Members Worldwide'}
              // description={sections.extraHeroes[0].description}
              pageHeading={false}
            />
          </div>
          <MembersWorldwideLeaflet />
          </div>

          <MembershipTypesSection
            memberTypes={sections.memberTypes[0]?.benefits}
            title={sections.memberTypes[0]?.title}
            description={sections.memberTypes[0]?.richIntro}
          />
          <SelectedMembershipType sections={sections}/>
          {/* <MemberShipDetailsSection
            memberTypes={sections.memberTypes?.[0]?.benefits || []}
            title={sections.memberTypes?.[0]?.title}
          />
          <JoinFormSection /> */}
          <div>
            {sections.testimonials && (
              <AdvancedCarousel
                itemsCount={sections.testimonials.items.length}
                title={sections.testimonials.title}
                description={''}
                pageHeading={false}
                // headerCta={cta}
                visibleSlides={{
                  xs: 1.2, // 1 card on mobile
                  sm: 1, // 2 cards on small tablets
                  md: 2, // 3 cards on tablets
                  lg: 2, // 4 cards on desktop
                  xl: 2, // 4 cards on large desktop
                }}
                slidesToScroll={1} // Scroll 1 card at a time
                autoplay={true}
                autoplayDelay={5000}
                loop={true}
                showControls={true}
                showProgressBar={true}
                containerClassName="py-10 md:py-20 px-5 md:px-30  gap-6"
                gap={12} // 16px gap between cards
              >
                {sections.testimonials.items.map((testimonial: any, idx: number) => (
                  <div key={idx} className="h-full mb-6">
                    <TestimonialCard
                      key={idx}
                      text={testimonial.text}
                      name={testimonial.name}
                      organization={testimonial.organization}
                      position={testimonial.position}
                      avatar={
                      testimonial?.avatar?.formats?.thumbnail
                      ? getStrapiMediaUrl(testimonial.avatar.formats.thumbnail)
                      : testimonial?.avatar?.url
                      ? getStrapiMediaUrl(testimonial.avatar.url)
                      : FALLBACK_IMAGE
                      }  
                      location={testimonial.location}
                    />
                  </div>
                ))}
              </AdvancedCarousel>
            )}
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
        </div>
        {sections.contactUs && (
          <ContactSection
            title={sections.contactUs.title}
            description={sections.contactUs.description}
            backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
            cta={sections.contactUs.cta??undefined}
          />
        )}
      </main>
    </div>
  );
}

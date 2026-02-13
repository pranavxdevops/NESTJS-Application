import FoundingMemberCard from '@/features/about/components/FoundingMemberCard';
import GridSection from '@/features/about/components/GridSection';
import transformCommittees from '@/lib/utils/transformCommittees';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/committees';
    return getPageSeo(urlSlug, locale);
}

export default async function Index({ params }: { params: Promise<{ locale: string }> }) {
   const { locale } = await params;
   const urlSlug = '/committees';
   const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=committees&populate=*
&populate[contents][on][sections.member-card][populate]=title
&populate[contents][on][sections.member-card][populate][members][populate][fields][0]=name
&populate[contents][on][sections.member-card][populate][members][populate][fields][1]=role
&populate[contents][on][sections.member-card][populate][members][populate][fields][2]=slug
&populate[contents][on][sections.member-card][populate][members][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.member-card][populate][members][populate][image][populate][image][fields][1]=formats
&populate[contents][on][sections.member-card][populate][members][populate][iconLink][populate]=*
&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
`,
      { next: { revalidate: 21600, tags: ['/api/committees'] } }
    );
    if (!res.ok) {
      return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
    }
    const json = await res.json();
    const sections = transformCommittees(json) || {};
    const seo = generateSeo(json?.data?.seo, locale, urlSlug);

  const breadcrumbItems = buildBreadcrumbs(sections.fullpath, {
    includeHome: true,
    homeLabel: 'Home'
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

        {sections.committees && (
          <GridSection
            heading={sections.committees.title}
            members={sections.committees.members}
            CardComponent={FoundingMemberCard}
          />
        )}

        {sections.boardMembers && (
          <GridSection
            heading={sections.boardMembers.title}
            members={sections.boardMembers.members}
            CardComponent={FoundingMemberCard}
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
                    {sections.ecosystem.cards.map((card:any, idx: number) => (
                      <div key={idx} className="h-full mb-6">
                        <ExploreCard 
                            image={
                             card?.backgroundImage?.formats?.medium
                             ? getStrapiMediaUrl(card.backgroundImage.formats.large)
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

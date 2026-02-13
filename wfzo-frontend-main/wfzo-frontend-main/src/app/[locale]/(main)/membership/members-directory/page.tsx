import MembersListing from '@/features/membership/components/MembersDirectory';
import ContactSection from '@/shared/components/ContactSection';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import MemberCard from '@/shared/components/MemberCard';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import transformMemberDirectory from '@/lib/utils/transformMemberDirectoryPage';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { EcosystemCard } from '@/shared/types/globals';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';
import { getContinent } from '@/lib/utils/getContinent';
import Link from 'next/link';

interface BackendMember {
  companyName: string;
  industries: string[];
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
    countryCode?: string;
  };
  memberLogoUrl: string;
  memberLogoUrlExpiresAt?: string;
  memberLogoUrlExpiresIn?: number;
  featuredMember: boolean;
}

interface MembersDirectoryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ industry?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/members-directory';
    return getPageSeo(urlSlug, locale);
}

const Page = async ({ params, searchParams }: MembersDirectoryPageProps) => {
  const { locale } = await params;
  const { industry: industryFromQuery } = await searchParams;

  const urlSlug = '/members-directory';

  // Fetch industries dynamically from API
  interface FilterOption {
    id: string | number;
    name: string;
    isActive?: boolean;
  }
  
  let industryOptions: FilterOption[] = [];
  try {
    const industriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}api/member-directory/industries?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 3600 } }
    );
    if (industriesRes.ok) {
      industryOptions = await industriesRes.json();
    }
  } catch (error) {
    console.error('Failed to fetch industries:', error);
    // Fallback to empty array if API fails
    industryOptions = [];
  }

const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=members-directory&populate=*
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
    { next: { revalidate: 21600, tags: ['/api/members-directory'] } }
  );
  if (!res.ok) {
    return <div className="w-[80%] mx-auto py-20">Error: Failed to fetch page data</div>;
  }
    const json = await res.json();
    const sections = transformMemberDirectory(json) || {};

    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const memberUrl = `${API_BASE}/wfzo/api/v1/member/active-list`;
    const memberRes = await fetch(memberUrl, {
      next: { revalidate: 21600 },
      headers: { accept: 'application/json' }
    });
    const backendMembers = await memberRes.json() as BackendMember[];
    
    // Create a map from industry code to label (e.g., "financialServices" -> "Financial Services")
    const codeToLabelMap = industryOptions.reduce((acc, option) => {
      acc[String(option.id)] = option.name;
      return acc;
    }, {} as Record<string, string>);
    
    const members = backendMembers.map((item: BackendMember, index: number) => ({
      id: index + 1,
      name: item.companyName,
      slug: item.companyName,
      logo: item.memberLogoUrl,
      logoExpiresAt: item.memberLogoUrlExpiresAt,
      logoExpiresIn: item.memberLogoUrlExpiresIn,
      industries: item.industries.map(code => codeToLabelMap[code] || code), // Convert codes to labels
      continent: getContinent(item.address?.country || ''),
      flag: item.address?.countryCode || '',
      address: item.address,
      featuredMember: item.featuredMember,
    }));
    const featuredMembers = members.filter((m) => m.featuredMember);

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
    {sections.featuredMember && featuredMembers.length > 0 && (
      <AdvancedCarousel
        itemsCount={featuredMembers.length}
        title={sections.featuredMember.title}
        description={sections.featuredMember.summary}
        pageHeading={false}
        // headerCta={cta}
        visibleSlides={{
          xs: 1.2, // 1 card on mobile
          sm: 2, // 2 cards on small tablets
          md: 2, // 3 cards on tablets
          lg: 4, // 4 cards on desktop
          xl: 4, // 4 cards on large desktop
        }}
        slidesToScroll={1} // Scroll 1 card at a time
        autoplay={true}
        autoplayDelay={5000}
        loop={true}
        showControls={true}
        showProgressBar={true}
        gap={12} // 16px gap between cards
        containerClassName='md:py-5 px-5 md:px-30  gap-2'
      >
        {featuredMembers.map((member) => (
          <div key={member.id} className="h-full mb-6">
             <Link href={`/${locale}/membership/members-directory/${member.slug}`}>
      <MemberCard member={member} />
    </Link>
          </div>
        ))}
      </AdvancedCarousel>
      )}
      <div id="members-section" className='scroll-mt-15'>
        <MembersListing
          members={members}
          filterOptions={industryOptions}
          header="Members"
          preselectedIndustry={industryFromQuery}
          locale={locale} 
        />
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

export default Page;

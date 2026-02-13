
import Hero from '@/features/about/components/Hero';
import LinkedInButton from '@/shared/components/LinkedInButton';
import ContentSection from '@/shared/components/ContentSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import FoundingMemberCard from '@/features/about/components/FoundingMemberCard';
import ContactSection from '@/shared/components/ContactSection';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import transformCommittees from '@/lib/utils/transformCommittees';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

export default async function BoardMemberDetailPage({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const { slug, locale } = await params;
  const memberSlug = Array.isArray(slug) ? slug[0] : slug;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }

  // 🧩 Build URLs
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=committees&populate=*
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
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats`;
  const memberUrl = `${baseUrl}/api/members?filters[slug][$eq]=${memberSlug}&populate[image][populate][image][fields][0]=url`;
  const allMembersUrl = `${baseUrl}/api/members?pagination[pageSize]=100&&populate[image][populate][image][fields][0]=url`;

  // 🧠 Fetch all data in parallel
  const [pageJson, memberJson, membersJson] = await Promise.all([
    fetchJson(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetchJson(memberUrl, { next: { revalidate: 3600, tags: ['/api/members'] } }),
    fetchJson(allMembersUrl, { next: { revalidate: 3600, tags: ['/api/members'] } }),
  ]);

  const sections = transformCommittees(pageJson);
  const member = memberJson.data?.[0];
  const allMembers = membersJson.data ?? [];


const otherMembers = allMembers.filter(
  (m: any) => m.id !== member?.id && m.type?.toLowerCase() === 'advisorsandcommittees'
);

  if (!member) {
    return <div>Member not found</div>;
  }

  // 🧭 Breadcrumbs
  const breadcrumbItems = buildBreadcrumbs(sections.fullpath, {
      includeHome: true,
      homeLabel: 'Home',
      trailingItem: {
      label: member?.name
    }
    });

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage} />

      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: member?.name,
          description: member?.role,
          showExploreAll: false,
          exploreAllHref: '/',
        }}
      />

      <div className="flex items-center mb-3 gap-3 w-full pt-5 px-5 md:px-30">
        {member?.linkedinUrl && <LinkedInButton url={member.linkedinUrl} />}
      </div>

      <ContentSection
        alignment="top"
        content={member?.biodata}
        imageUrl={
          getStrapiMediaUrl(member.image?.image?.formats?.large) ||
          getStrapiMediaUrl(member.image?.image?.url)
        }
        imagePosition="left"
        imageHeight="tall"
      />

      {otherMembers.length > 0 && (
        <AdvancedCarousel
          itemsCount={otherMembers.length}
          title="Other Advisors and Committee Members"
          pageHeading={false}
          visibleSlides={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
          autoplay
          autoplayDelay={3000}
          loop
          showControls
          showProgressBar
          gap={12}
        >
          {otherMembers.map((m: any, idx: number) => (
            <div key={idx} className="h-full mb-6">
              <FoundingMemberCard
                name={m.name}
                role={m.role}
                bio={m.bio}
                imageUrl={
                  getStrapiMediaUrl(m.image?.image?.formats?.large) ||
                  getStrapiMediaUrl(m.image?.image?.url)
                }
                linkedinUrl={m.linkedinUrl}
                memberUrl={sections.fullpath+'/'+m.slug}
                description={m.organisationDesignation}
              />
              
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {sections.ecosystem && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem.cards.length}
          title={sections.ecosystem.title}
          description={sections.ecosystem.description}
          visibleSlides={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
          slidesToScroll={1}
          autoplay
          autoplayDelay={5000}
          loop
          showControls
          showProgressBar
          gap={16}
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
    </div>
  );
}

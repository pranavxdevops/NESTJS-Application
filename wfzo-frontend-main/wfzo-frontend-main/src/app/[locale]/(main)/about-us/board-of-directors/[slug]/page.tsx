import transformBoardOfDirectors from '@/lib/utils/transformBoardOfDirectors';
import ContentSection from '@/shared/components/ContentSection';
import ContactSection from '@/shared/components/ContactSection';
import LinkedInButton from '@/shared/components/LinkedInButton';
import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import FoundingMemberCard from '@/features/about/components/FoundingMemberCard';
import GridSection from '@/features/about/components/GridSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

type Props = {
  params: Promise<{ slug: string[]; locale: string }>;
};

export default async function BoardMemberDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const memberSlug = Array.isArray(slug) ? slug[0] : slug;
  // Fetch data on the server
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=board-of-directors&populate=*
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
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats`,
    { next: { revalidate: 21600, tags: ['/api/board-of-directors/'+memberSlug] } }
  );
  if (!res.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }
  const json = await res.json();
  const sections = transformBoardOfDirectors(json) || {};
  
  const allMembers = sections.boardMembers?.members || [];
  const member = allMembers.find((m: any) => m.slug === memberSlug) || allMembers[0];
  const otherMembers = allMembers.filter((m: any) => m.slug !== member?.slug);
  const breadcrumbItems = [
    { isHome: true, label: 'Home' },
    { label: 'About us' },
    { label: sections.title, href: sections.fullPath },
    { label: member?.name, isCurrent: true },
  ];

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage} />
      <div>
        <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: member?.name,
          description: member?.role,
        }}
        containerClassName=""
      />
        <div className="flex items-center mb-3 gap-3 w-full pt-5 px-5 md:px-30">
          {member?.linkedinUrl && <LinkedInButton url={member?.linkedinUrl} />}
        </div>
 
        <ContentSection
          alignment="top"
          content={member?.bio}
          imageUrl={member.imageUrl?.formats?.large || member.imageUrl?.url}
          imagePosition="left"
          imageHeight="tall"
        />
        {otherMembers && (
           <GridSection
              heading="Other Board Members"
              members={otherMembers}
              CardComponent={FoundingMemberCard}
            />                     
        )}
        {sections.committees && (
          <AdvancedCarousel
                      itemsCount={sections.committees?.members.length}
                      title={sections.committees.title}
                      description={sections.committees.description}
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
                      autoplayDelay={3000}
                      loop={true}
                      showControls={true}
                      showProgressBar={true}
                      gap={12} // 16px gap between cards
                    >
                      {sections.committees?.members.map((member:any, idx: number) => (
                        <div key={idx} className="h-full mb-6">
                          <FoundingMemberCard
                            name={member.name}
                            role={member.role || ''}
                            bio={member.biodata || ''}
                            organisationDesignation={member.organisationDesignation}
                            imageUrl={member.imageUrl?.large || member.imageUrl?.url}
                            linkedinUrl={member.linkedinUrl}
                            description={member.description}
                            memberUrl={member.memberUrl}
                          />
                        </div>
                      ))}
                    </AdvancedCarousel>
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

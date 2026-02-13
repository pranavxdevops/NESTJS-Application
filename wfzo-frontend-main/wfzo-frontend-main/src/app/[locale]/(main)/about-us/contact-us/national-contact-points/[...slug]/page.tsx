import ContactCard from '@/features/about/components/ContactCard';
import ContentSection from '@/shared/components/ContentSection';
import ExploreCard from '@/shared/components/ExploreCard';
import Hero from '@/features/about/components/Hero';
import InfoChip from '@/features/about/components/InfoChip';
import TwinContentSection from '@/features/membership/components/TwinContentSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import React from 'react';
import transformNationalContactPoints from '@/lib/utils/transformNationalContactPoints';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { Globe, Linkedin, Mail, Phone } from 'lucide-react';

interface Office {
  id: number;

  title?: string;
  slug?: string;
  fullPath?: string;
  [key: string]: any; // optional fallback for other Strapi fields
}

async function fetchJson(url: string, options: { next: { revalidate: number; tags: string[] } }) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default async function NationalContactPointPage({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const finalSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }
  const pageUrl = `${baseUrl}/api/pages?filters[slug][$eq]=ncp-name
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][sections.bannersection][populate]=*
&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats
&populate[contents][on][sections.text-image][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.text-image][populate][image][populate][image][fields][1]=formats
&populate[contents][on][sections.officecard][populate][cta][populate]=*
&populate[contents][on][sections.officecard][populate][offices][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.officecard][populate][offices][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*`;

  const allOfficesUrl = `${baseUrl}/api/offices
?filters[officeType][$eq]=national
&populate[officeSecondLevelText][populate][image][populate][image]=true
&populate[image][populate][image]=true
&populate[bannersection][populate][backgroundImage][populate][image]=true
&populate[bannersection][populate][image][populate][image]=true
&locale=en`;

  const [allOfficesJson] = await Promise.all([
    fetchJson(allOfficesUrl, { next: { revalidate: 21600, tags: ['/api/office'] } }),
  ]);
  const allOffices: Office[] = allOfficesJson?.data || [];

  // Find current and other offices
  const currentOffice = allOffices.find((office) => office?.slug === finalSlug);

  const otherOffices = allOffices.filter((office) => office?.slug !== finalSlug);

  // In parallel: fetch page & office data (for transformations)
  const [pageJson] = await Promise.all([
    fetchJson(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
  ]);

  if (!currentOffice) {
    return <div className="p-10 text-center text-gray-600">page not found.</div>;
  }

  const sections = transformNationalContactPoints(pageJson, currentOffice, otherOffices, finalSlug);
  const ecosystemCards = sections?.ecosystem?.cards ?? [];

  const Path = sections.fullPath;

  const trimmedPath = Path.split('/').slice(0, -1).join('/');
  const fullPath = `${trimmedPath}/${finalSlug}`;

  const breadcrumbItems = buildBreadcrumbs(fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: currentOffice?.companyname ?? 'National Contact Points ',
  });

  const chips = [
    currentOffice.linkedin && {
      icon: <Linkedin className="w-4 h-4" />,
      label: currentOffice.linkedin,
      href: currentOffice.linkedin, // if this is a URL, else adjust
      variant: 'linkedin',
    },
    currentOffice.phone && {
      icon: <Phone className="w-4 h-4" />,
      label: currentOffice.phone,
      href: `tel:${currentOffice.phone.replace(/\s+/g, '')}`,
    },
    currentOffice.email && {
      icon: <Mail className="w-4 h-4" />,
      label: currentOffice.email,
      href: `mailto:${currentOffice.email}`,
    },
    currentOffice.website && {
      icon: <Globe className="w-4 h-4" />,
      label: currentOffice.website,
      href: currentOffice.website.startsWith('http')
        ? currentOffice.website
        : `https://${currentOffice.website}`,
    },
  ].filter(Boolean); // removes null entries

  const officeCards = sections.officeCardSection?.offices || [];

  const officeSectionTitle = sections.officeCardSection?.title || 'Other National Contact Points';

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage ?? undefined} />

      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: currentOffice?.companyname,
          description: currentOffice?.officePrimaryDetails,
          showExploreAll: false,
        }}
      />

      {/* ✅ Info Chips */}
      <div className="flex flex-wrap gap-4 mb-8 font-source px-5 md:px-30">
        {chips.map((chip, idx) => (
          <InfoChip key={idx} {...chip} />
        ))}
      </div>

      {sections.bannersection && (
        <ContentSection
          title={sections.bannersection.title}
          content={sections.bannersection.shortDescription}
          imageUrl={getStrapiMediaUrl(sections.bannersection.image) || FALLBACK_IMAGE}
          imagePosition={sections?.bannersection?.imagePosition || 'left'}
          alignment="center"
          backgroundImage={sections.bannersection.backgroundImage || CONTENTHEADER_BG_IMAGE}
        />
      )}

      {sections.officeSecondLevelText && sections.officeSecondLevelText.length === 2 && (
        <TwinContentSection sections={sections.officeSecondLevelText} />
      )}

      {officeCards.length > 0 && (
        <AdvancedCarousel
          itemsCount={officeCards.length}
          title={officeSectionTitle}
          description={officeCards.description}
          visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: 3, xl: 4 }}
          slidesToScroll={1}
          autoplay
          autoplayDelay={5000}
          loop
          showControls
          showProgressBar
          gap={12}
        >
          {officeCards.map((office: any, idx: number) => (
            <div key={idx} className="h-full mb-6">
              <ContactCard {...office} cardUrl={office.fullPath} />
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {/* ✅ Ecosystem / Explore Section */}
      {ecosystemCards.length > 0 && (
        <AdvancedCarousel
          itemsCount={ecosystemCards.length}
          title={sections.ecosystem?.title}
          description={sections.ecosystem?.description}
          pageHeading={false}
          visibleSlides={{
            xs: 1.2,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 3,
          }}
          slidesToScroll={1}
          autoplay
          autoplayDelay={5000}
          loop
          showControls
          showProgressBar
          gap={16}
        >
          {ecosystemCards.map((card: any, index: number) => (
            <div key={index} className="h-full mb-6">
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
  );
}
 
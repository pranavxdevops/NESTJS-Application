import ContentSection from '@/shared/components/ContentSection';
import InfoChip from '@/features/about/components/InfoChip';
import ContactSection from '@/shared/components/ContactSection';
import { Phone, Mail, Linkedin, Globe } from 'lucide-react';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import transformRegionalOffice from '@/lib/utils/transformRegionalOffice';
import Hero from '@/features/about/components/Hero';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactCard from '@/features/about/components/ContactCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';

import TwinContentSection from '@/features/membership/components/TwinContentSection';

type Props = {
  params: Promise<{ slug: string[]; locale: string }>;
};

interface Office {
  id: number;
  title?: string;
  slug?: string;
  fullPath?: string;
  [key: string]: any; // optional fallback for other Strapi fields
}

type OfficeCardSection = {
  title: string;
  description?: string;
  isChevronEnabled?: boolean;
  cta?: {
    title?: string;
    href?: string;
    targetBlank?: boolean;
    variant?: string;
    type?: string;
    internalLink?: string | null;
  } | null;
  offices: Office[];
};

async function fetchJson(url: string, options: { next: { revalidate: number; tags: string[] } }) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default async function RegionalOfficeDetailPage(props: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const { slug } = await props.params;
  const officeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  // Fetch Contact Us page which contains RO and NCP cards
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=ro-name&populate=*
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
&populate[contents][on][sections.officecard][populate][cta][populate]=*
&populate[contents][on][sections.officecard][populate][offices][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.officecard][populate][offices][populate][image][populate][image][fields][1]=formats
&populate[contents][on][sections.officecard][populate][offices][populate][officeSecondLevelText][populate][image][populate][image][fields][0]=url
&populate[contents][on][sections.officecard][populate][offices][populate][officeSecondLevelText][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*`,
    { next: { revalidate: 21600, tags: [`/api/pages`] } }
  );

  const allOfficesUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/offices
?filters[officeType][$eq]=regional
&populate[officeSecondLevelText][populate][image][populate][image]=true
&populate[image][populate][image]=true
&populate[bannersection][populate][backgroundImage][populate][image]=true
&populate[bannersection][populate][image][populate][image]=true
&locale=en`;

  const allOfficesRes = await fetch(allOfficesUrl, {
    next: { revalidate: 21600, tags: [`/api/office`] },
  });

  const allOfficesJson = await allOfficesRes.json();
  const allRegionalOffices: Office[] = allOfficesJson?.data || [];

  const currentOffice = allRegionalOffices.find((o) => o.slug === officeSlug);

  const otherOffices = allRegionalOffices.filter((o: Office) => o.slug !== officeSlug);

  if (!currentOffice) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch page data</div>;
  }

  const json = await res.json();
  const sections = transformRegionalOffice(json, currentOffice, otherOffices, officeSlug) || {};

  const selected = currentOffice;

  const otherOfficesForCarousel = sections.officeCards || [];

  const fullPath = `${sections.fullPath}/${selected?.slug}`;

  const breadcrumbItems = buildBreadcrumbs(fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: selected?.companyname,
  });

  const chips = [
    selected.linkedin && {
      icon: <Linkedin className="w-4 h-4" />,
      label: selected.linkedin,
      href: selected.linkedin, // if this is a URL, else adjust
      variant: 'linkedin',
    },
    selected.phone && {
      icon: <Phone className="w-4 h-4" />,
      label: selected.phone,
      href: `tel:${selected.phone.replace(/\s+/g, '')}`,
    },
    selected.email && {
      icon: <Mail className="w-4 h-4" />,
      label: selected.email,
      href: `mailto:${selected.email}`,
    },
    selected.website && {
      icon: <Globe className="w-4 h-4" />,
      label: selected.website,
      href: selected.website.startsWith('http') ? selected.website : `https://${selected.website}`,
    },
  ].filter(Boolean);

  return (
    <div>
      {/* HERO SECTION */}
      <Hero imageUrl={sections.hero?.heroImage} />

      {/* BREADCRUMB + HEADER */}
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: selected?.companyname,
          description: selected?.officePrimaryDetails,
          showExploreAll: false,
        }}
      />

      {/* ✅ Info Chips */}
      <div className="flex flex-wrap gap-4 mb-8 font-source px-5 md:px-30">
        {chips.map((chip, idx) => (
          <InfoChip key={idx} {...chip} />
        ))}
      </div>

      {selected.bannersection && (
        <ContentSection
          title={selected.bannersection.title}
          content={selected.bannersection.shortDescription}
          imageUrl={getStrapiMediaUrl(selected.bannersection.image?.image?.url) || FALLBACK_IMAGE}
          imagePosition={selected?.bannersection?.imagePosition || 'left'}
          alignment="center"
          backgroundImage={
            selected.bannersection.backgroundImage?.image?.url || CONTENTHEADER_BG_IMAGE
          }
        />
      )}

      {sections.officeSecondLevelText && sections.officeSecondLevelText.length === 2 && (
        <TwinContentSection sections={sections.officeSecondLevelText} />
      )}

      {/* OTHER REGIONAL OFFICES CAROUSEL */}
      {otherOfficesForCarousel.length > 0 && (
        <AdvancedCarousel
          itemsCount={otherOfficesForCarousel.length}
          title={'Other Regional Offices'}
          description={sections?.ecosystem?.description}
          visibleSlides={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
          slidesToScroll={1}
          autoplay={true}
          autoplayDelay={5000}
          loop={true}
          showControls={true}
          showProgressBar={true}
          gap={12}
        >
          {otherOfficesForCarousel.map((office: any, idx: number) => (
            <div key={idx} className="h-full mb-6">
              <ContactCard {...office} cardUrl={office.fullPath} />
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {/* ECOSYSTEM CAROUSEL */}
      {sections.ecosystem && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem.cards.length}
          title={sections.ecosystem.title}
          description={sections.ecosystem.description}
          visibleSlides={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
          slidesToScroll={1}
          autoplay={true}
          autoplayDelay={5000}
          loop={true}
          showControls={true}
          showProgressBar={true}
          gap={16}
        >
          {sections.ecosystem.cards.map((card: any, idx: number) => (
            <div key={idx} className="h-full my-6">
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
  );
}
 
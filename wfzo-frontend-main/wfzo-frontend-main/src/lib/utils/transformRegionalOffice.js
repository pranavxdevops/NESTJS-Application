import {
  transformHero,
  transformEcosystem,
  transformContactUs,
  transformContactForm,
  transformOfficeCardsByTitle,
  transformTextImage,
} from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getCountryISOCode } from './getCountryISOCode';
import { transformImage } from './transformHomepage';

export default function transformRegionalOffice(
  strapiJson,
  currentOffice,
  otherOffices,
  finalSlug
) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // SECTION COMPONENTS
  const heroSection = sections.find((s) => s.__component === 'sections.sections-hero');
  const textImageSections = sections.filter((s) => s.__component === 'sections.text-image');
  const contactBlock = sections.find((s) => s.__component === 'shared.contact-block');
  const officeCardSection = sections.find((s) => s.__component === 'sections.officecard');
  const ecosystem = sections.find((s) => s.__component === 'home.ecosystem');
  const contactUs = sections.find((s) => s.__component === 'home.contact-us');

  const bannersection = currentOffice?.bannersection || null;

  // -------------------------
  // OTHER OFFICE CARDS
  // -------------------------
  const officeCards =
    otherOffices
      ?.filter((office) => office.slug !== finalSlug)
      .map((office) => ({
        country: office.region || office.flag || 'N/A',
        flag: getCountryISOCode(office.flag) || 'AE',
        company: office.companyname || 'N/A',
        email: office.email || 'N/A',
        phone: office.phone || 'N/A',
        image: office.image?.image?.url
          ? {
              url: getStrapiMediaUrl(office.image.image.url, FALLBACK_IMAGE),
              alt: office.companyname || 'Office Image',
            }
          : { url: FALLBACK_IMAGE, alt: office.companyname || 'Office Image' },
        slug: office.slug,
        fullPath: `/about-us/contact-us/regional-offices/${office.slug}`,
      })) || [];

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,

    // -------------------------
    // HERO
    // -------------------------
    hero: heroSection ? transformHero(heroSection) : null,

    // -------------------------
    // TEXT-IMAGE
    // -------------------------
    textImages: textImageSections?.length
      ? textImageSections.map((ti) => ({
          title: ti.title,
          content: ti.description || ti.content,
          imagePosition: ti.imagePosition,
          imageUrl: ti.image?.image?.url
            ? getStrapiMediaUrl(ti.image.image.url, FALLBACK_IMAGE)
            : FALLBACK_IMAGE,
          alternateText: ti.image?.alternateText,
        }))
      : null,

    // -------------------------
    // BANNER (TOP)
    // -------------------------
    bannersection: bannersection
      ? {
          description: bannersection.shortDescription,
          imagePosition: bannersection.imagePosition || 'left',
          imageUrl: transformImage(bannersection.image),
          bg: bannersection.backgroundImage?.image?.url
            ? getStrapiMediaUrl(bannersection.backgroundImage.image.url, CONTENTHEADER_BG_IMAGE)
            : null,
        }
      : null,

    // -------------------------
    // CURRENT OFFICE DETAILS
    // -------------------------
    currentOffice: currentOffice
      ? {
          companyname: currentOffice.companyname || '',
          email: currentOffice.email || '',
          phone: currentOffice.phone || '',
          region: currentOffice.region || '',
          description: currentOffice.officePrimaryDetails || [],
          image: currentOffice.image?.image?.url
            ? getStrapiMediaUrl(currentOffice.image.image.url)
            : FALLBACK_IMAGE,
        }
      : null,

    // -------------------------
    // SECOND LEVEL TEXTS
    // -------------------------
    officeSecondLevelText: currentOffice?.officeSecondLevelText
      ? currentOffice.officeSecondLevelText.map((item) => ({
          id: item.id,
          title: item.title || '',
          imagePosition: item.imagePosition || 'left',
          content: item.description || '',
          imageUrl: transformImage(item.image),
          alt: item.image?.alternateText || item.title || '',
        }))
      : [],

    // -------------------------
    // CARDS (RO + NCP within same page)
    // -------------------------
    roCards: transformOfficeCardsByTitle(sections, 'Regional Offices', data, 'regional-offices'),

    ncpCards: transformOfficeCardsByTitle(
      sections,
      'National Contact Points',
      data,
      'national-contact-points'
    ),

    officeCards,

    // -------------------------
    // BOTTOM BANNER (IF YOU NEED)
    // -------------------------
    bannersection: bannersection
      ? {
          title: bannersection.title || '',
          imagePosition: bannersection.imagePosition || 'left',
          backgroundImage: bannersection.backgroundImage?.image?.url
            ? getStrapiMediaUrl(bannersection.backgroundImage.image.url, FALLBACK_IMAGE)
            : FALLBACK_IMAGE,
          image: bannersection.image?.image?.url
            ? getStrapiMediaUrl(bannersection.image.image.url, FALLBACK_IMAGE)
            : FALLBACK_IMAGE,
          shortDescription: bannersection.shortDescription || '',
        }
      : null,

    // -------------------------
    // OTHER SHARED SECTIONS
    // -------------------------
    officeCardSection: officeCardSection
      ? {
          title: officeCardSection.title || 'Other Offices',
          offices: officeCards,
        }
      : null,

    contactBlock: contactBlock ? transformContactForm(contactBlock) : null,
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
  };
}

 
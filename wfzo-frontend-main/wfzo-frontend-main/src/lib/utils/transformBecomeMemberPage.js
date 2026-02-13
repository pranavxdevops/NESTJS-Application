import { transformHero, transformEcosystem, transformContactUs, transformContactForm } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getCountryISOCode } from './getCountryISOCode';
import { transformThumbnailImage } from './transformHomepage';
// No direct media mapping needed here; rely on helpers where applicable

// Maps `home.about-summary` blocks to a unified shape
function transformAboutSummary(section) {
  if (!section) return null;
  return {
    title: section.title,
    shortDescription: section.shortDescription || null,
    benefits: (section.statistics || []).map(stat => ({
      iconKey: stat.iconKey || null,
      value: stat.value || null,
      label: stat.label || '',
      info: stat.info || '',
      description: stat.description || '',
      image:  stat.image?.url
					? getStrapiMediaUrl( stat.image.url, FALLBACK_IMAGE)
					: null,
    })),
  };
}

export default function transformBecomeMemberPage(strapiJson) {
  const data = strapiJson?.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Collect sections we care about
  const heroSections = sections.filter(s => s.__component === 'sections.sections-hero');
  const memberSummary = sections.filter(s => s.__component === 'home.about-summary' && s.title === 'Access Exclusive Member Benefits');
  const memberTypes = sections.filter(s => s.__component === 'home.about-summary' && s.title === 'Types of Membership');
  const contactBlocks = sections.filter(s => s.__component === 'shared.contact-block');
  const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
  const testimonials = sections.find(s => s.__component === 'sections.testimonials');
  const contactUsFooter = sections.find(s => s.__component === 'home.contact-us');

  // Map testimonials to a normalized shape
  const mappedTestimonials = testimonials ? {
    title: testimonials.title || 'Testimonials',
    items: (testimonials.testimonial || []).map(t => ({
      id: t.id,
      text: t.description || '',
      name: t.personName || '',
      organization: [t.organisationName, t.location].filter(Boolean).join(', '),
      position: t.designation || '',
      avatar: transformThumbnailImage(t.coverImage),
      location: getCountryISOCode(t.location)  || '',
    })),
  } : null;

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,

    // First hero as primary, additional heroes as optional list
    hero: heroSections[0] ? transformHero(heroSections[0]) : null,
    extraHeroes: heroSections.slice(1).map(transformHero),

    // About summaries (e.g., Benefits of being a member, Types of Membership)
    memberSummary: memberSummary.map(transformAboutSummary),
    memberTypes: memberTypes.map(transformAboutSummary),

    // Contact blocks to render forms (Organization Details, Personal Details)
    contactBlocks: contactBlocks.map(transformContactForm),

    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    testimonials: mappedTestimonials,
    contactUs: contactUsFooter ? transformContactUs(contactUsFooter) : null,
  };
}

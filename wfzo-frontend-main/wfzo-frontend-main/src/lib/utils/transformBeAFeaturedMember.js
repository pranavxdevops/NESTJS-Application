import { transformHero, transformEcosystem, transformContactUs, transformExpertInsights } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { transformImage } from './transformHomepage';

export default function transformBeAFeaturedMember(strapiJson) {
  const data = strapiJson.data?.[0];
  if (!data) {
    console.warn('[transformBeAFeaturedMember] No data found in Strapi response');
    return {};
  }

  const sections = data.contents || [];

  // Hero section
  const hero = sections.find(s => s.__component === "sections.sections-hero");
  // Banner section
  const banner = sections.find(s => s.__component === "sections.bannersection");
  // Ecosystem section
  const ecosystem = sections.find(s => s.__component === "home.ecosystem");
  // Contact us section
  const contactUs = sections.find(s => s.__component === "home.contact-us");
  // Expert insight block section
  const expertInsightBlock = sections.find(s => s.__component === "shared.expert-insight-block");

  console.log('[transformBeAFeaturedMember] Found sections:', sections.map(s => s.__component));
  console.log('[transformBeAFeaturedMember] Hero section:', hero);
  console.log('[transformBeAFeaturedMember] Banner section:', banner);

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: hero ? transformHero(hero) : null,
    banner: banner ? {
      description: banner.shortDescription || banner.description || '',
      imagePosition: banner.imagePosition || "left",
      imageUrl: banner.image ? transformImage(banner.image) : null,
      bg: banner.backgroundImage?.image?.url
        ? getStrapiMediaUrl(banner.backgroundImage.image.url, CONTENTHEADER_BG_IMAGE)
        : CONTENTHEADER_BG_IMAGE,
    } : null,
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
    expertInsights: expertInsightBlock ? transformExpertInsights(expertInsightBlock) : null,
  };
}

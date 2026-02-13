import { transformHero, transformTextImage, transformEcosystem, transformContactUs } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { transformImage } from './transformHomepage';

export default function transformFreeZoneOfTheFutureIndex(strapiJson) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Hero section
  const hero = sections.find(s => s.__component === "sections.sections-hero");
  // Banner section
  const banner = sections.find(s => s.__component === "sections.bannersection");
  // Text-image sections
  const textImages = sections.filter(s => s.__component === "sections.text-image");
  // Ecosystem section
  const ecosystem = sections.find(s => s.__component === "home.ecosystem");
  // Contact us section
  const contactUs = sections.find(s => s.__component === "home.contact-us");

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: hero ? transformHero(hero) : null,
    banner: banner && {
      description: banner.shortDescription,
      imagePosition: banner.imagePosition || "left",
      imageUrl: transformImage(banner.image),
      bg: banner.backgroundImage?.image?.url ? getStrapiMediaUrl(banner.backgroundImage.image.url, CONTENTHEADER_BG_IMAGE) : CONTENTHEADER_BG_IMAGE,
    },
    textImages: textImages.map(transformTextImage),
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
  };
}
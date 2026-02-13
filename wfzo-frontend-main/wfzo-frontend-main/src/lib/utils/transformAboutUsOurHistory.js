import { transformHero, transformTextImage, transformEcosystem, transformContactUs } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { transformImage } from './transformHomepage';

export default function transformAboutUsHistory(strapiJson) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Hero section
  const hero = sections.find(s => s.__component === "sections.sections-hero");
  // Banner section
  const banner = sections.find(s => s.__component === "sections.bannersection");
  // Text-image sections
  const textImages = sections.filter(s => s.__component === "sections.text-image");
  // Media banner
  const mediaBanner = sections.find(s => s.__component === "sections.media-banner");
  // Member card
  const memberCard = sections.find(s => s.__component === "sections.member-card");
  // Ecosystem
  const ecosystem = sections.find(s => s.__component === "home.ecosystem");
  // Contact us
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
      bg: banner.backgroundImage?.image?.url ? getStrapiMediaUrl(banner.backgroundImage.image.url, CONTENTHEADER_BG_IMAGE) : null,
    },
    textImages: textImages.map(transformTextImage),
    mediaBanner: mediaBanner && {
      caption: mediaBanner.shortDescription,
      imageUrl: transformImage(mediaBanner.image),
    },
    memberCard: memberCard && {
      title: memberCard.title,
      description: memberCard.description,
      members: memberCard.members?.map(m => ({
        name: m.name,
        role: m.role,
        bio: m.biodata,
        type: m.type,
        imageUrl: transformImage(m.image),
      })),
    },
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
  };
}
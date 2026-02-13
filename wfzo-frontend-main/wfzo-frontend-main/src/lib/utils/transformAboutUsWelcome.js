import { transformHero, transformTextImage, transformEcosystem, transformContactUs } from './commonTransformation';

export default function transformAboutUsWelcome(strapiJson) {
     const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Hero section
  const hero = sections.find(s => s.__component === "sections.sections-hero");
  // Text-image sections
  const textImages = sections.filter(s => s.__component === "sections.text-image");
  // Ecosystem
  const ecosystem = sections.find(s => s.__component === "home.ecosystem");
  // Contact us
  const contactUs = sections.find(s => s.__component === "home.contact-us");
  return{
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: hero ? transformHero(hero) : null,
    textImages: textImages.map(transformTextImage),
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
  }
    
}  
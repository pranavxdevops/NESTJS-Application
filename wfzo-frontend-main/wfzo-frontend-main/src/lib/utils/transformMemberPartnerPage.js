import { transformHero, transformEcosystem, transformContactUs } from './commonTransformation';
// No direct media mapping needed here; rely on helpers where applicable

export default function transformMemberPartner(strapiJson) {
  const data = strapiJson?.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Collect sections we care about
  const heroSections = sections.filter(s => s.__component === 'sections.sections-hero');
  const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
  const contactUsFooter = sections.find(s => s.__component === 'home.contact-us');

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: heroSections[0] ? transformHero(heroSections[0]) : null,
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUsFooter ? transformContactUs(contactUsFooter) : null,
  };
}

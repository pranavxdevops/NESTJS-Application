import { transformEventItem, filterAndSortPastEvents, transformHero, transformEcosystem, transformContactUs } from './commonTransformation';

export default function transformPastEventsPage(strapiJson) {
  const data = strapiJson?.data?.[0];
  if (!data) return {};

  const sections = data?.contents || [];
  const eventsSection = sections.find((s) => s?.__component === 'sections.section-events');
  const heroSection = sections.find((s) => ['sections.sections-hero', 'sections.hero', 'sections.section-hero'].includes(s?.__component));
  const ecosystemSection = sections.find((s) => s?.__component === 'home.ecosystem');
  const contactUsSection = sections.find((s) => s?.__component === 'home.contact-us');

  const rawEvents = eventsSection?.events || [];
  const pastEvents = filterAndSortPastEvents(rawEvents);
  const events = pastEvents
    .map(transformEventItem)
    .filter((event) => Boolean(event));

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: heroSection ? transformHero(heroSection) : null,
    ecosystem: ecosystemSection ? transformEcosystem(ecosystemSection) : null,
    contactUs: contactUsSection ? transformContactUs(contactUsSection) : null,
    events,
  };
}

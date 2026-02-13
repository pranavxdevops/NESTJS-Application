import { transformEventItem, filterAndSortUpcomingEvents, transformHero, transformEcosystem, transformContactUs } from './commonTransformation';

// Transformer for the Events page response returned by:
// /api/pages?filters[slug][$eq]=events&populate[contents][on][sections.section-events][populate]=events
// It extracts only upcoming events (future or ongoing) and returns a normalized shape.

export default function transformEventsPage(strapiJson) {
  const data = strapiJson?.data?.[0];
  if (!data) return {};

  const sections = data?.contents || [];
  const eventsSection = sections.find((s) => s?.__component === 'sections.section-events');
  const heroSection = sections.find((s) => ['sections.sections-hero', 'sections.hero', 'sections.section-hero'].includes(s?.__component));
  const ecosystemSection = sections.find((s) => s?.__component === 'home.ecosystem');
  const contactUsSection = sections.find((s) => s?.__component === 'home.contact-us');

  const rawEvents = eventsSection?.events || [];
  const upcoming = filterAndSortUpcomingEvents(rawEvents);
  const events = upcoming.map(transformEventItem);

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

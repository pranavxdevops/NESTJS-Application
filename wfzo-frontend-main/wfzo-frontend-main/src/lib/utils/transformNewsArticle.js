import { normalizeNewsPage, transformContactUs, transformEcosystem, transformHero, transformNewsCardItem } from './commonTransformation';

export default function transformNewsArticle(pageJson,articleJson, newsPagesJson) {
  const data = pageJson?.data?.[0] ?? null;
  const sections = data?.contents ?? [];





  const heroSection = sections.find((section) =>
    ['sections.sections-hero', 'sections.hero', 'sections.section-hero'].includes(section?.__component)
  );
  const ecosystemSection = sections.find((section) => section?.__component === 'home.ecosystem');
  const contactUsSection = sections.find((section) => section?.__component === 'home.contact-us');

  const newsEntries = (newsPagesJson?.data ?? []).map(normalizeNewsPage).filter(Boolean);


  // Collect featured news across all news pages
  const featuredNews = (newsPagesJson?.data ?? [])
    .flatMap((entry) => {
      const items = entry?.featured_news || [];
      return items.map((item) => ({ item, entry }));
    })
    .map(({ item, entry }) =>
      transformNewsCardItem(item, {
        // Prefer subcategory label if provided; otherwise fall back to the owning news page title
        categoryTitle: item?.subcategory?.title || item?.news_page?.title || entry?.title || '',
        categorySlug: item?.subcategory?.slug || item?.news_page?.slug || entry?.slug || '',
      })
    )
    .filter(Boolean);




  return {
    title: data?.title ?? null,
    slug: data?.slug ?? null,
    fullPath: data?.fullPath ?? null,
    hero: heroSection ? transformHero(heroSection) : null,
    ecosystem: ecosystemSection ? transformEcosystem(ecosystemSection) : null,
    contactUs: contactUsSection ? transformContactUs(contactUsSection) : null,
    newsCategories: newsEntries,
    featuredNews,
  };
}

 
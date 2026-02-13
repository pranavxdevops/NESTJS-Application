import { transformHero } from './commonTransformation';

export interface KnowledgeItem {
  title: string;
  description: string;
  href?: string;
}

export interface KnowledgePageData {
  fullPath: string | null;
  title: string | null;
  slug: string | null;
  hero: {
    component: string;
    id: number;
    title: string | null;
    description: string | null;
    heroImage: string | null;
  } | null;
  knowledgeItems: KnowledgeItem[];
}

export default function transformKnowledge(strapiJson: unknown): KnowledgePageData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (strapiJson as any).data?.[0];
  if (!data) {
    console.warn('[transformKnowledge] No data found in Strapi response');
    return {
      fullPath: null,
      title: null,
      slug: null,
      hero: null,
      knowledgeItems: [],
    };
  }

  const sections = data.contents || [];

  // Hero section
  const hero = sections.find((s: { __component?: string }) => s.__component === "sections.sections-hero");

  // Knowledge items section - customize based on your Strapi component structure
  const knowledgeSection = sections.find(
    (s: { __component?: string }) => s.__component === "sections.knowledge-items"
  );

  const knowledgeItems: KnowledgeItem[] = knowledgeSection?.items?.map((item: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemAny = item as any;
    return {
      title: itemAny.title || '',
      description: itemAny.description || '',
      href: itemAny.href || itemAny.link || '',
    };
  }) || [];

  console.log('[transformKnowledge] Found sections:', sections.map((s: { __component?: string }) => s.__component));
  console.log('[transformKnowledge] Hero section:', hero);
  console.log('[transformKnowledge] Knowledge items:', knowledgeItems);

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: hero ? transformHero(hero) : null,
    knowledgeItems,
  };
}

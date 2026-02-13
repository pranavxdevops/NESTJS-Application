import HomeNewsCarousel from './HomeNewsCarousel';
import { getTabs, getArticles } from '@/lib/news';
import { FALLBACK_IMAGE, MAX_ITEMS_PER_CATEGORY } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';

interface StrapiArticle {
  [key: string]: any;
}

export interface NewsSectionProps {
  id: number;
  component: string;
  title: string;
  url: string;
  tabs: StrapiArticle[];
  cta?: unknown | null;
}

interface CardProps {
  id: string | number;
  title: string;
  slug: string;
  category: string;
  description: string;
  publishedDate: string;
  readTime: string;
  author: string;
  organization: string;
  authorImg: string | null;
  image: string;
  isLocked: boolean;
  type: string;
  source?: string;
  document?: string;
  documentSection?: {
    id: number;
    href: string;
    downloadLabel: string;
    viewLabel: string;
  };
}

type TabData = {
  id: number;
  title: string;
  cards: CardProps[];
};

const normalizeArticle = (item: StrapiArticle, index: number): CardProps & { rawUpdatedAt: string } => {
  const id = String(item.id || item.documentId || item.slug || `article-${index}`);
  const title = item.title || (item.attributes?.title) || 'Untitled Article';
  const slug = item.slug || '';
  let category = '';
  if (typeof item.articleCategory === 'object' && item.articleCategory) {
    category = item.articleCategory.title;
  } else if (item.articleCategory) {
    category = item.articleCategory;
  } else if (item.attributes?.articleCategory?.data?.attributes?.title) {
    category = item.attributes.articleCategory.data.attributes.title;
  } else if (item.attributes?.category?.title) {
    category = item.attributes.category.title;
  }
  const description = item.shortDescription || (item.attributes?.shortDescription) || '';
  const updatedAt = item.updatedAt || (item.attributes?.updatedAt);
  const publishedDate = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '';
  const organization = item.organizationName || (item.attributes?.organizationName) || '';
  const author = item.authorName || (item.attributes?.authorName) || '';
  let authorImg: string | null = null;
  const authorPhoto = item.authorImage || (item.attributes?.authorImage);
  if (authorPhoto) {
    if (typeof authorPhoto === 'object' && authorPhoto.url) {
      authorImg = getStrapiMediaUrl(authorPhoto.url);
    } else if (authorPhoto) {
      authorImg = getStrapiMediaUrl(authorPhoto);
    }
  }
  let image = FALLBACK_IMAGE;
  const newsImage = item.newsImage || (item.attributes?.newsImage);
  if (newsImage) {
    if (newsImage.formats?.large?.url) {
      image = getStrapiMediaUrl(newsImage.formats.large.url);
    } else if (newsImage.url) {
      image = getStrapiMediaUrl(newsImage.url);
    }
  }
  const articleFormat = item.articleFormat || (item.attributes?.articleFormat);
  const type = articleFormat === 'pdf' ? 'document' : 'article';
  let document: string | undefined;
  const pdfFile = item.pdfFile || (item.attributes?.pdfFile);
  if (pdfFile?.url) {
    document = getStrapiMediaUrl(pdfFile.url);
  }
  const documentSection = document ? {
    id: Number(id) || index,
    href: pdfFile.url || '',
    downloadLabel: 'Download PDF',
    viewLabel: 'View',
  } : undefined;
  return {
    id,
    title,
    slug,
    category,
    description,
    publishedDate,
    readTime: '5 min read',
    author,
    organization,
    authorImg,
    image,
    isLocked: category.toLowerCase().includes('member'),
    type,
    source: type,
    document,
    documentSection,
    rawUpdatedAt: updatedAt,
  };
};

export default async function NewsSection({ title }: NewsSectionProps) {
  const rawTabs: StrapiArticle[] = await getTabs();
  const rawArticles: StrapiArticle[] = await getArticles();
  const articlesWithDate = rawArticles.map((item, index) => normalizeArticle(item, index));
  const allRawCardsWithDate = articlesWithDate;
  const sortByDateDesc = (a: (typeof allRawCardsWithDate)[0], b: (typeof allRawCardsWithDate)[0]) => 
    new Date(b.rawUpdatedAt).getTime() - new Date(a.rawUpdatedAt).getTime();
  const sortedAllCardsWithDate = [...allRawCardsWithDate].sort(sortByDateDesc);
  const sortedAllCards: CardProps[] = sortedAllCardsWithDate;
  const categoryGroups: Record<string, CardProps[]> = {};
  sortedAllCards.forEach(card => {
    const catKey = card.category.toLowerCase().trim();
    if (catKey) {
      if (!categoryGroups[catKey]) {
        categoryGroups[catKey] = [];
      }
      categoryGroups[catKey].push(card);
    }
  });
  interface TempTab {
    id: number;
    title: string;
    cards: CardProps[];
    order: number;
  }
  const categoryTabs: TempTab[] = rawTabs.map((tabRaw: StrapiArticle) => {
    const id = tabRaw.id ?? tabRaw.attributes?.id ?? 0;
    const title = tabRaw.title ?? tabRaw.attributes?.title ?? '';
    const order = tabRaw.order ?? tabRaw.attributes?.order ?? Infinity;
    const catKey = title.toLowerCase().trim();
    const cards = categoryGroups[catKey]?.slice(0, MAX_ITEMS_PER_CATEGORY) ?? [];
    return { id, title, cards, order };
  }).filter((tab: TempTab) => tab.cards.length > 0)
    .sort((a: TempTab, b: TempTab) => a.order - b.order);
  const allTabCards = categoryTabs.flatMap(tab => tab.cards);
  const allTab: TabData = {
    id: 0,
    title: 'All',
    cards: allTabCards,
  };
  const allTabs: TabData[] = [allTab, ...categoryTabs];
  return (
    <section className="bg-[#FCFAF8]">
      <HomeNewsCarousel title={title} allTabs={allTabs} />
    </section>
  );
}

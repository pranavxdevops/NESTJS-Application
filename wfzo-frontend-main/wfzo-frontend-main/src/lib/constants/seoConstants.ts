export const PAGE_TYPES = {
  HOME: 'home',
  PAGE: 'page',
  ARTICLE: 'article',
  EVENT: 'event',
} as const;

export type PageType = (typeof PAGE_TYPES)[keyof typeof PAGE_TYPES];
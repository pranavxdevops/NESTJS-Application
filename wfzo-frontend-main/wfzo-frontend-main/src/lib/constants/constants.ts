export const MAX_ITEMS_PER_CATEGORY = 9;
export const DEFAULT_SEARCH_PAGE_SIZE = 5;

export const CATEGORY_COLORS: Record<string, { text: string; background: string }> = {
  default: {
    text: '#6B7280', // gray
    background: '#F3F4F6', // light gray bg
  },
  Library: {
    text: '#248F50', // green
    background: '#EDFDF3', // light green bg
  },
  Reports: {
    text: '#248F50', // green
    background: '#EDFDF3', // light green bg
  },
  'News Releases': {
    text: '#D61B0A', // red
    background: '#FFEFEB',
  },
  Newsletter: {
    text: '#0963CE', // blue
    background: '#EBF7FF',
  },
  'World FZO News': {
    text: '#273CA5', // yellow
    background: '#EEF1FB',
  },
  'Member News': {
    text: '#A38529', // yellow
    background: '#FDF9ED',
  },
  Bulletins: {
    text: '#0963CE', // yellow
    background: '#EBF7FF',
  },
  Papers: {
    text: '#D61B0A', // green
    background: '#FFEFEB', // light green bg
  },
};


export const FALLBACK_VIDEO = '/assets/hero_video.mp4';
// Optimized mobile-friendly lower resolution / smaller file size video (to be generated separately)
export const FALLBACK_VIDEO_MOBILE = '/assets/hero_video_mobile.mp4';

// Category -> Icon path mapping (public folder). Update paths to match final Figma-approved icons.
export const CATEGORY_ICONS: Record<string, string> = {
  // Knowledge/Library types
  Reports: '/reports_icon.svg',
  Papers: '/papers_icon.svg',
  Bulletins: '/bulletins.svg',

  // News types
  'Member News': '/members_news_icon.svg',
  'World FZO News': '/world_news_icon.svg',
  'General News': '/general_news_icon.svg',

  // Existing categories in use
  Library: '/reports_icon.svg',
  'News Releases': '/window.svg',
  Newsletter: '/bulletins.svg',
};

export const CONTENTHEADER_BG_IMAGE = '/assets/map-pattern.png';
export const FALLBACK_BG_IMAGE = '/assets/slider-fallback.png';
export const FALLBACK_VIDEO_BG ='/assets/video-bg.png';
export const FALLBACK_IMAGE = '/assets/fallback-image.jpg';

export const CATEGORIES = {
  NEWS_RELEASES: 'News Releases',
  NEWSLETTER: 'Newsletter',
  LIBRARY: 'Library',
  MEMBER_NEWS: 'Member News',
  WORLD_FZO_NEWS: 'World FZO News',
} as const;

// Optional: create a type for stricter type checking
export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export const GALLERY_TYPE = {
  VIDEO_GALLERY: 'video-gallery',
  PHOTO_GALLERY: 'photo-gallery',
} as const;

export type GalleryType = typeof GALLERY_TYPE[keyof typeof GALLERY_TYPE];

export const FORM_FIELD_KEYS = {
  NEWS_LETTER: 'primaryNewsLetterSubscription',
  AUTHORIZATION: 'authorizedPersonDeclaration',
  PRIMARY_CONTACT: "primaryContactFirstName"
} as const;

export type FieldKeyType = typeof FORM_FIELD_KEYS[keyof typeof FORM_FIELD_KEYS];

export const FILE_TYPES = {
  MEMBER_LOGO: 'member-logo',
  MEMBER_LICENSE: 'member-license',
  MEMBER_SIGNATURE: 'memberSignature',
  OTHER: 'other',
} as const;

export type FileKeyType = typeof FILE_TYPES[keyof typeof FILE_TYPES];

export const FILE_SIZE_LIMITS = {
  IMAGE: 1 * 1024 * 1024, // 1MB
  PDF: 2 * 1024 * 1024, // 5MB
} as const;

export const FILE_SIZE_DISPLAY_TEXT = {
  IMAGE: '1MB',
  PDF: '2MB',
} as const;

// Articles of Association PDF URL
export const ARTICLES_OF_ASSOCIATION_PDF_URL = '/assets/articles_of_association.pdf';
export const MAX_ALLOWED_USER_COUNT = 10;
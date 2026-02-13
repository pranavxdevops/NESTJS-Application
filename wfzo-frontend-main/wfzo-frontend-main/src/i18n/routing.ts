import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr','es'],
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/about-us': {
      en: '/about-us',
      fr: '/about-us',
    },
    '/membership': {
      en: '/membership',
      fr: '/membership',
    },
    '/featured': {
      en: '/featured',
      fr: '/featured',
    },
    '/profile': {
      en: '/profile',
      fr: '/profile',
    },
    '/profile/complete-profile': {
      en: '/profile/complete-profile',
      fr: '/profile/complete-profile',
    },
    '/our-partners': {
      en: '/our-partners',
      fr: '/our-partners',
    },
    '/contact': {
      en: '/contact',
      fr: '/contact',
    },
    '/:path*': {  // ✅ proper catch-all
      en: '/:path*',
      fr: '/:path*',
      es: '/:path*',
    }
  },
});

export const SUPPORTED_LOCALES = ['en', 'fr', 'de','es'];
export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

// fonts.ts
import { Montserrat, Source_Sans_3 } from 'next/font/google';

export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat', // Must match Tailwind config
  display: 'swap',
});

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans-3', // Must match Tailwind config
  display: 'swap',
});
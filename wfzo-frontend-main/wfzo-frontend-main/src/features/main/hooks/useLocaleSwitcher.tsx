'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { routing } from 'i18n/routing';

interface Language {
  id: number;
  title: string; // e.g. "French"
  code: string;  // e.g. "fr"
}

export function useLocaleSwitcher(footRes?: { languages?: Language[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLang, setSelectedLang] = useState<string>('English');

  // 🧠 Detect and persist selected language from URL or session
  useEffect(() => {
    if (!pathname) return;

    const match = pathname.match(/^\/(en|fr|ar|es)(?=\/|$)/);

    const urlLocale = match?.[1] || routing.defaultLocale;

    // Persist to session
    sessionStorage.setItem('locale', urlLocale);

    // 🗣 Find corresponding language title from Strapi
    const activeLang =
      footRes?.languages?.find((lang) => lang.code === urlLocale)?.title ||
      'English';

    setSelectedLang(activeLang);
  }, [pathname, footRes?.languages]); // ✅ run when languages load or path changes

  // 🌍 Handle locale change
  const handleLocaleChange = (title: string, code: string) => {
    sessionStorage.setItem('locale', code);
    setSelectedLang(title);

    const localePattern = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);
    const newPath = pathname.replace(localePattern, `/${code}`);
    const finalPath = localePattern.test(pathname)
      ? newPath
      : `/${code}${pathname}`;

    router.push(finalPath);
    router.refresh();
  };

  return {
    selectedLang,
    handleLocaleChange,
  };
}

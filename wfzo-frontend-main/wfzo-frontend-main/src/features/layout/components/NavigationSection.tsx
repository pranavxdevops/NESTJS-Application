// app/components/NavigationSection.tsx or .jsx (Server Component)

import React from 'react';
import Navigation from './NavigationMenu';
import Image from 'next/image';
import { transformNavigation } from '@/lib/utils/transformNavigation';

const NavigationSection = async ({
  params,
}: {
  params:{ locale: string };
}) => {
  const { locale } = params;
  console.log("NavigationSection locale:", locale);
  const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/navigation?locale=${locale}`, {
    next: { revalidate: 21600, tags: ['/api/navigation'] },
  });
  const homeRes = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/home?populate[sections][on][home.hero][populate][overlayEvent][populate][image][populate]=*&populate[sections][on][home.hero][populate][overlayEvent][populate][cta][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/events'] } }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch navigation data');
  }

  const data = await res.json();
  const refinedData = transformNavigation(data);

  type FeaturedEvent = {
    title?: string | null;
    organizer?: string | null;
    summary?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    location?: string | null;
    registrationUrl?: string | null;
    coverImage?: { image?: { url?: string | null } | null } | null;
    cta?: {
      href?: string | null;
      title?: string | null;
      targetBlank?: boolean | null;
      internalLink?: { fullPath?: string | null } | null;
    } | null;
  } | null;

  let featuredEvent: FeaturedEvent = null;
  try {
    const homeJson = await homeRes.json();
    const sections: Array<{ __component?: string; overlayEvent?: FeaturedEvent }> =
      homeJson?.data?.sections || [];
    const hero = sections.find((s) => s?.__component === 'home.hero');
    featuredEvent = hero?.overlayEvent || null;
  } catch {
    featuredEvent = null;
  }

  return (
    <div>
      <Navigation
        logo={refinedData?.logo}
        refinedData={refinedData?.items}
        cta={refinedData?.cta ?? null}
        dropIcon={<Image src="/assets/dropdown_white.svg" alt="dropdown" width={16} height={16} />}
        featuredEvent={featuredEvent || undefined}
        locale={locale}
      />
    </div>
  );
};

export default NavigationSection;

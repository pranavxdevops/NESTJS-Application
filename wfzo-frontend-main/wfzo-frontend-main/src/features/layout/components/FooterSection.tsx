import React from 'react';
import ContactFooter from './Footer';
import { transformNavigation } from '@/lib/utils/transformNavigation';
import { transformFooter } from '@/lib/utils/transformHomepage';

export default async function FooterSection({
  params,
}: {
  params:{ locale: string };
}) {  
  const { locale } = params;
  try {
    // 1️⃣ Fetch data from Strapi
    const navRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/navigation?locale=${locale}`, {
      next: { revalidate: 21600, tags: ['/api/nav'] },
    });
    const footRes = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/footer?populate=*&locale=${locale}`,
      { next: { revalidate: 21600, tags: ['/api/footer'] } }
    );
    const navData = await navRes.json();
    const footData = await footRes.json();
    const refinedData = transformNavigation(navData);

    const footer = transformFooter(footData);
    return (
      <div>
        <ContactFooter refinedData={refinedData?.items} footRes={footer} logo={refinedData?.logo} />
      </div>
    );
  } catch (error) {
    console.error('Error loading ContactFooterSection:', error);
    return <div></div>;
  }
}

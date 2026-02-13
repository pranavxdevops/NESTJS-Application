// import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
// import GoldButton from '@/shared/components/GoldButton';
// import StatusBadge from '@/features/events/dashboard/component/StatusBadge';
// import ContentSection from '@/shared/components/ContentSection';
// import { ArrowLeft } from 'lucide-react';
// import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
// import { FALLBACK_IMAGE } from '@/lib/constants/constants';
// import Link from 'next/link';
// import HeroAuth from '@/features/events/dashboard/component/HeroAuth';

// interface WebinarDetailSection {
//   title?: string;
//   description?: string;
//   imagePosition?: string;
//   image?: {
//     image?: {
//       url?: string;
//     };
//   };
// }

// type PageProps = {
//   params: Promise<{ slug: string; locale: string }>;
// };

// interface RawWebinarDetailSection {
//   title?: string;
//   description?: string;
//   imagePosition?: 'left' | 'right';
//   image?: any;
// }

// interface TransformedWebinarDetailSection {
//   title: string;
//   content: string;
//   imagePosition: 'left' | 'right';
//   imageUrl: string;
// }

// export default async function WebinarDetailPage({ params }: PageProps) {
//   const { slug, locale } = await params;

//   if (!slug) {
//     return <div className="w-[85%] mx-auto py-10 md:py-20">Missing webinar slug</div>;
//   }

//   // Fetch webinar data
//   const webinarUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?filters[slug][$eq]=${encodeURIComponent(slug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][0]=url&populate[seo][populate]=*`;

//   const webinarRes = await fetch(webinarUrl, {
//     next: { revalidate: 21600, tags: ['/api/webinars'] },
//   });

//   if (!webinarRes.ok) {
//     return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch webinar</div>;
//   }

//   const webinarJson = await webinarRes.json();
//   const webinarData = webinarJson?.data?.[0];
  
//   if (!webinarData) {
//     return <div className="w-[85%] mx-auto py-10 md:py-20">Webinar not found</div>;
//   }

//   // Determine webinar status
//   const now = new Date();
//   const startDate = webinarData?.startDate ? new Date(webinarData.startDate) : null;
//   const endDate = webinarData?.endDate ? new Date(webinarData.endDate) : null;

//   let webinarStatus: 'webinar' | 'past' | 'ongoing' | 'registered' = 'webinar';
//   if (endDate && endDate < now) {
//     webinarStatus = 'past';
//   } else if (startDate && endDate && startDate <= now && now <= endDate) {
//     webinarStatus = 'ongoing';
//   }

//   // Format date
//   const formatDate = (d: Date) =>
//     d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

//   let dateStr = '';
//   if (startDate && endDate) {
//     dateStr = `${formatDate(startDate)} - ${formatDate(endDate)}`;
//   } else if (startDate) {
//     dateStr = formatDate(startDate);
//   } else if (endDate) {
//     dateStr = formatDate(endDate);
//   }

//   // Format time
//   const timeStr = startDate
//     ? startDate.toLocaleTimeString(undefined, {
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true
//       }) + ' (GMT +4)'
//     : '';

//   // Transform webinar details sections
//   const webinarDetails: TransformedWebinarDetailSection[] = Array.isArray(webinarData?.webinar_details)
//     ? webinarData.webinar_details.map((d: RawWebinarDetailSection) => {
//         let imageUrl = FALLBACK_IMAGE;
//         if (d.image) {
//           // Handle Strapi v4 structure: image.data.attributes.url
//           if (d.image.data?.attributes?.url) {
//             imageUrl = getStrapiMediaUrl(d.image.data.attributes.url);
//           }
//           // Handle legacy structure: image.image.url
//           else if (d.image.image?.url) {
//             imageUrl = getStrapiMediaUrl(d.image.image.url);
//           }
//           // Handle direct url
//           else if (d.image.url) {
//             imageUrl = getStrapiMediaUrl(d.image.url);
//           }
//         }
//         return {
//           title: d.title || 'Webinar detail title',
//           content: d.description || 'Webinar detail description',
//           imagePosition: d.imagePosition || 'left',
//           imageUrl,
//         };
//       })
//     : [];

//   const breadcrumbItems: BreadcrumbItem[] = [
//     { label: "Home", href: "/", isHome: true },
//     { label: "Knowledge", href: "/knowledge/dashboard" },
//     { label: "Webinars", href: "/knowledge/webinars" },
//     { label: webinarData?.title || 'Webinar', isCurrent: true }
//   ];

//   return (
//     <div className="bg-wfzo-gold-25 min-h-screen">
//       {/* HERO IMAGE */}
//       <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

//       {/* MAIN CONTENT CONTAINER */}
//       <div className="px-5 md:px-30 py-10">
//         {/* BACK BUTTON */}
//         <Link 
//           href="/knowledge/webinars"
//           className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
//         >
//           <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
//           <span className="font-source text-base font-semibold">Back</span>
//         </Link>

//         {/* BREADCRUMB */}
//         <div className="mb-6">
//           <Breadcrumb items={breadcrumbItems} />
//         </div>

//         {/* WEBINAR HEADER */}
//         <div className="mb-8 flex flex-col gap-4">
//           <h1 className="font-montserrat text-4xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
//             {webinarData?.title || 'Webinar Name'}
//           </h1>

//           {webinarData?.organizer && (
//             <a
//               href="#"
//               className="font-source text-base text-wfzo-gold-600 underline w-fit"
//             >
//               {webinarData.organizer}
//             </a>
//           )}

//           {/* DATE */}
//           <div className="flex items-center gap-3">
//             <p className="font-source text-xl text-wfzo-grey-800">
//               {dateStr}
//               {webinarData?.eventType && ` (${webinarData.eventType})`}
//             </p>
//           </div>

//           {/* TIME AND LOCATION */}
//           <div className="flex items-center gap-4 flex-wrap">
//             {timeStr && (
//               <p className="font-source text-sm text-wfzo-grey-700">
//                 {timeStr}
//               </p>
//             )}
//             {timeStr && webinarData?.location && (
//               <span className="text-wfzo-grey-700">-</span>
//             )}
//             {(webinarData?.location || !webinarData?.city) && (
//               <p className="font-source text-sm text-wfzo-grey-700">
//                 {webinarData?.location
//                   ? `${webinarData.location}${webinarData.city ? `, ${webinarData.city}` : ''}`
//                   : 'Online'}
//               </p>
//             )}
//           </div>

//           {/* STATUS BADGE */}
//           <div>
//             <StatusBadge status={webinarStatus} />
//           </div>

//           {/* DESCRIPTION */}
//           {webinarData?.shortDescription && (
//             <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
//               {webinarData.shortDescription}
//             </p>
//           )}

//           {/* REGISTER BUTTON */}
//           {webinarData?.cta && (
//             <div className="mt-2">
//               <Link href={webinarData.cta.href || ''}>
//                 <GoldButton>
//                   {webinarData.cta.title || 'Register here'}
//                 </GoldButton>
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* CONTENT SECTIONS */}
//       {webinarDetails && webinarDetails.length > 0 && (
//         <div className="w-full max-w-full mx-auto">
//           {webinarDetails.map((section: TransformedWebinarDetailSection, index: number) => {
//             const imageUrl = section.imageUrl || FALLBACK_IMAGE;

//             return (
//               <div key={index}>
//                 <ContentSection
//                   title={section.title}
//                   content={section.content}
//                   imageUrl={imageUrl}
//                   imagePosition={section.imagePosition}
//                   imageHeight="tall"
//                   alignment="center"
//                   className={index > 0 ? "pt-0 md:pt-0 pb-0 md:pb-0" : ""}
//                 />
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* BOTTOM REGISTER BUTTON */}
//       {webinarDetails && webinarDetails.length > 0 && webinarData?.cta && (
//         <div className="flex justify-center py-12">
//           <Link href={webinarData.cta?.href || ''}>
//             <GoldButton>
//               {webinarData.cta.title || 'Register here'}
//             </GoldButton>
//           </Link>
//         </div>
//       )}
//     </div>
//   );
// }
import ContentSection from '@/shared/components/ContentSection';
import ContactSection from '@/shared/components/ContactSection';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import TwinContentSection from '@/features/membership/components/TwinContentSection';
import Hero from '@/features/about/components/Hero';
import Link from 'next/link';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { CONTENTHEADER_BG_IMAGE, FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard } from '@/shared/types/globals';
import { generateSeo } from '@/lib/utils/seo/generateSeo';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';

// You'll probably want to create this (copy + adapt from transformEventDetailPage)
import transformWebinarDetailPage from '@/lib/utils/transformWebinarDetailPage';
import { BreadcrumbItem } from '@/shared/components/Breadcrumb';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const webinarSlug = slug; // single slug assumed

  const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
  const res = await fetch(
    `${STRAPI_BASE}/api/webinars?filters[slug][$eq]=${encodeURIComponent(webinarSlug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][0]=url&populate[seo][populate]=*`,
    { next: { revalidate: 21600, tags: [`/api/webinars/${webinarSlug}`] } }
  );

  if (!res.ok) throw new Error(`Failed to fetch SEO for webinar: ${webinarSlug}`);
  const json = await res.json();
  const webinarData = json?.data?.[0];
  const seo = webinarData?.Seo;
  const fullPath = webinarData?.fullPath || `/knowledge/webinars/${webinarSlug}`;
  const urlSlug = `/knowledge/webinars/${webinarSlug}`;

  return generateSeo(seo, locale, urlSlug, fullPath);
}

export default async function WebinarDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing webinar slug</div>;
  }

  const webinarSlug = slug; // assuming single slug (not array)

  // ────────────────────────────────────────────────
  // Main webinar data - need to explicitly populate nested image fields
  // ────────────────────────────────────────────────
  const webinarUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?filters[slug][$eq]=${encodeURIComponent(webinarSlug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats&populate[webinar_details][populate][image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][1]=formats&populate[seo][populate]=*`;

  // ────────────────────────────────────────────────
  // Extras (ecosystem + contact) — taken from knowledge page for shared blocks
  // ────────────────────────────────────────────────
  const extrasUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=webinars-slug-page&locale=${locale}&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats&populate[contents][on][home.contact-us][populate][cta][populate]=*&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats`;

  const [webinarRes, extraRes] = await Promise.all([
    fetch(webinarUrl,    { next: { revalidate: 21600, tags: ['/api/webinars'] } }),
    fetch(extrasUrl,     { next: { revalidate: 21600, tags: ['/api/knowledge-extras'] } }),
  ]);

  if (!webinarRes.ok) {
    const errorText = await webinarRes.text();
    console.error('Webinar fetch error:', webinarRes.status, errorText);
    return (
      <div className="w-[85%] mx-auto py-10 md:py-20">
        <h1 className="text-2xl font-bold mb-4">Error: Failed to fetch webinar</h1>
        <p>Status: {webinarRes.status}</p>
        <p>Slug: {webinarSlug}</p>
        <p className="mt-4">
          <Link href="/knowledge/webinars" className="text-blue-600 underline">
            Back to Webinars
          </Link>
        </p>
      </div>
    );
  }

  const webinarJson = await webinarRes.json();
  const extraJson   = await extraRes.json();

  const webinarData = webinarJson?.data?.[0];
  
  if (!webinarData) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Webinar not found</div>;
  }

  const sections = transformWebinarDetailPage(webinarJson, extraJson);

  // ────────────────────────────────────────────────
  // Breadcrumbs — adapt path prefix to webinars
  // ────────────────────────────────────────────────
  // const breadcrumbItems = buildBreadcrumbs(sections?.fullPath ?? `/knowledge/webinars/${webinarSlug}`, {
  //   includeHome: true,
  //   homeLabel: 'Home',
  //   trailingItem: {
  //     label: sections?.title || webinarData?.title || 'Webinar',
  //   },
  // });
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/", isHome: true },
    { label: "Knowledge", href: "/knowledge/dashboard" },
    { label: "Webinars", href: "/knowledge/webinars" },
    { label: webinarData?.title || 'Webinar', isCurrent: true }
  ];

  const fullPath = webinarData?.fullPath || `/knowledge/webinars/${webinarSlug}`;
  const startDateTime = webinarData?.startDate || webinarData?.startDateTime;
  const urlSlug = `/knowledge/webinars/${webinarSlug}`;
console.log('Generating SEO for webinar:', sections);
  const seo = generateSeo(
    webinarData?.Seo,
    locale,
    urlSlug,
    fullPath,
    startDateTime
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />

      {/* Hero — using webinar main image or fallback to page hero */}
      <Hero imageUrl={
        typeof sections.hero?.heroImage === 'string' 
          ? sections.hero.heroImage 
          : sections.hero?.heroImage?.url 
            ? getStrapiMediaUrl(sections.hero.heroImage.url)
            : undefined
      } />

      {/* Title / organizer / short summary block — same as events */}
      <BreadcrumbContentHeader
        breadcrumbItems={breadcrumbItems}
        contentHeaderProps={{
          header: sections?.hero?.title || webinarData?.title || 'Webinar',
          description: sections?.hero?.description || webinarData?.shortDescription || '',
          showExploreAll: false,
          exploreAllHref: '/',
          showOrgName: sections?.organization || webinarData?.organizer || '',
        }}
        containerClassName=""
      />

      {/* Main banner-like section (often first rich content block) */}
      {sections?.banner && (
        <ContentSection
          content={sections.banner.description || ''}
          imageUrl={
            typeof sections.banner.imageUrl === 'string'
              ? getStrapiMediaUrl(sections.banner.imageUrl)
              : sections.banner.imageUrl?.url
                ? getStrapiMediaUrl(sections.banner.imageUrl.url)
                : FALLBACK_IMAGE
          }
          imagePosition={sections?.banner?.imagePosition || 'left'}
          alignment="center"
          backgroundImage={sections.banner.bg || CONTENTHEADER_BG_IMAGE}
          cta={sections.banner.cta ?? undefined}
        />
      )}

      {/* Render all webinar detail sections */}
      {sections?.textImages && sections.textImages.length > 0 && (
        sections.textImages.length === 2 ? (
          <TwinContentSection sections={sections.textImages} />
        ) : (
          <div className="w-full">
            {sections.textImages.map((section: any, index: number) => (
              <ContentSection
                key={index}
                title={section.title}
                content={section.content}
                imageUrl={
                  section.imageUrl?.url
                    ? getStrapiMediaUrl(section.imageUrl.url)
                    : FALLBACK_IMAGE
                }
                imagePosition={section.imagePosition || 'left'}
                alignment="center"
              />
            ))}
          </div>
        )
      )}

      {/* Ecosystem / related items carousel — from shared page data */}
      {sections?.ecosystem && (
        <AdvancedCarousel
          itemsCount={sections.ecosystem?.cards.length}
          title={sections.ecosystem.title}
          description={sections.ecosystem.description}
          pageHeading={false}
          visibleSlides={{ xs: 1.2, sm: 2, md: 2, lg: 3, xl: 3 }}
          slidesToScroll={1}
          autoplay={true}
          autoplayDelay={5000}
          loop={true}
          showControls={true}
          showProgressBar={true}
          gap={16}
        >
          {sections.ecosystem.cards.map((card: EcosystemCard, idx: number) => (
            <div key={idx} className="h-full mb-6">
              <ExploreCard
                image={
                  card?.backgroundImage?.formats?.medium
                    ? getStrapiMediaUrl(card.backgroundImage.formats.medium)
                    : card?.backgroundImage?.url
                      ? getStrapiMediaUrl(card.backgroundImage.url)
                      : FALLBACK_IMAGE
                }
                title={card.title || ''}
                link={card.link || '/'}
              />
            </div>
          ))}
        </AdvancedCarousel>
      )}

      {/* Contact / CTA footer section */}
      {sections?.contactUs && (
        <ContactSection
          title={sections.contactUs.title}
          description={sections.contactUs.description}
          backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
          cta={sections.contactUs.cta ?? undefined}
        />
      )}
    </div>
  );
}
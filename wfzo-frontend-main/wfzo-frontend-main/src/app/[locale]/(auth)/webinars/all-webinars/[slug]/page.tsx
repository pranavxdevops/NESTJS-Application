import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import GoldButton from '@/shared/components/GoldButton';
import StatusBadge from '@/features/events/dashboard/component/StatusBadge';
import ContentSection from '@/shared/components/ContentSection';
import { ArrowLeft } from 'lucide-react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Link from 'next/link';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';

interface WebinarDetailSection {
  title?: string;
  description?: string;
  imagePosition?: string;
  image?: {
    image?: {
      url?: string;
    };
  };
}

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

interface RawWebinarDetailSection {
  title?: string;
  description?: string;
  imagePosition?: 'left' | 'right';
  image?: any;
}

interface TransformedWebinarDetailSection {
  title: string;
  content: string;
  imagePosition: 'left' | 'right';
  imageUrl: string;
}

export default async function AllWebinarsDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing webinar slug</div>;
  }

  const webinarSlug = Array.isArray(slug) ? slug[0] : slug;

  // Fetch webinar data
  const webinarUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/webinars?status=draft&filters[slug][$eq]=${encodeURIComponent(webinarSlug)}&locale=${locale}&populate[cta][populate]=*&populate[image][populate][image][fields][0]=url&populate[webinar_details][populate][image][populate][image][fields][0]=url&populate[seo][populate]=*`;

  const webinarRes = await fetch(webinarUrl, {
    cache: 'no-store'
  });

  if (!webinarRes.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch webinar</div>;
  }

  const webinarJson = await webinarRes.json();
  const webinarData = webinarJson?.data?.[0];
  
  if (!webinarData) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Webinar not found</div>;
  }

  // Determine webinar status
  const now = new Date();
  const startDate = webinarData?.startDate ? new Date(webinarData.startDate) : null;
  const endDate = webinarData?.endDate ? new Date(webinarData.endDate) : null;

  let webinarStatus: 'webinar' | 'past' | 'ongoing' | 'registered' = 'webinar';
  if (endDate && endDate < now) {
    webinarStatus = 'past';
  } else if (startDate && endDate && startDate <= now && now <= endDate) {
    webinarStatus = 'ongoing';
  }

  // Format date
  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  let dateStr = '';
  if (startDate && endDate) {
    dateStr = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } else if (startDate) {
    dateStr = formatDate(startDate);
  } else if (endDate) {
    dateStr = formatDate(endDate);
  }

  // Format time
  const timeStr = startDate
    ? startDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (GMT +4)'
    : '';

  // Transform webinar details sections
  const webinarDetails: TransformedWebinarDetailSection[] = Array.isArray(webinarData?.webinar_details)
    ? webinarData.webinar_details.map((d: RawWebinarDetailSection) => {
        let imageUrl = FALLBACK_IMAGE;
        if (d.image) {
          // Handle Strapi v4 structure: image.data.attributes.url
          if (d.image.data?.attributes?.url) {
            imageUrl = getStrapiMediaUrl(d.image.data.attributes.url);
          }
          // Handle legacy structure: image.image.url
          else if (d.image.image?.url) {
            imageUrl = getStrapiMediaUrl(d.image.image.url);
          }
          // Handle direct url
          else if (d.image.url) {
            imageUrl = getStrapiMediaUrl(d.image.url);
          }
        }
        return {
          title: d.title || 'Webinar detail title',
          content: d.description || 'Webinar detail description',
          imagePosition: d.imagePosition || 'left',
          imageUrl,
        };
      })
    : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Webinars", href: "/events/dashboard", isHome: false },
    { label: "All Webinars", href: "/webinars/all-webinars", isHome: false },
    { label: webinarData?.title || 'Webinar name', isCurrent: true }
  ];

  return (
    <div className="bg-wfzo-gold-25 min-h-screen">
      {/* HERO IMAGE */}
  <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

      {/* MAIN CONTENT CONTAINER */}
      <div className="px-5 md:px-30 py-10">
        {/* BACK BUTTON */}
        <Link 
          href="/webinars/all-webinars"
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </Link>

        {/* BREADCRUMB */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* WEBINAR HEADER */}
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-montserrat text-4xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
            {webinarData?.title || 'Webinar Name'}
          </h1>

          {webinarData?.organizer && (
            <a
              href="#"
              className="font-source text-base text-wfzo-gold-600 underline w-fit"
            >
              {webinarData.organizer}
            </a>
          )}

          {/* DATE */}
          <div className="flex items-center gap-3">
            <p className="font-source text-xl text-wfzo-grey-800">
              {dateStr}
              {webinarData?.eventType && ` (${webinarData.eventType})`}
            </p>
          </div>

          {/* TIME AND LOCATION */}
          <div className="flex items-center gap-4 flex-wrap">
            {timeStr && (
              <p className="font-source text-sm text-wfzo-grey-700">
                {timeStr}
              </p>
            )}
            {timeStr && webinarData?.location && (
              <span className="text-wfzo-grey-700">-</span>
            )}
            {(webinarData?.location || !webinarData?.city) && (
              <p className="font-source text-sm text-wfzo-grey-700">
                {webinarData?.location
                  ? `${webinarData.location}${webinarData.city ? `, ${webinarData.city}` : ''}`
                  : 'Online'}
              </p>
            )}
          </div>

          {/* STATUS BADGE */}
          <div>
            <StatusBadge status={webinarStatus} />
          </div>

          {/* DESCRIPTION */}
          {webinarData?.shortDescription && (
            <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
              {webinarData.shortDescription}
            </p>
          )}

          {/* REGISTER BUTTON */}
          {webinarData?.cta && (
            <div className="mt-2">
              <Link href={webinarData.cta.href || ''}>
                <GoldButton>
                  {webinarData.cta.title || 'Register here'}
                </GoldButton>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      {webinarDetails && webinarDetails.length > 0 && (
        <div className="w-full max-w-full mx-auto">
          {webinarDetails.map((section: TransformedWebinarDetailSection, index: number) => {
            const imageUrl = section.imageUrl || FALLBACK_IMAGE;

            return (
              <div key={index}>
                <ContentSection
                  title={section.title}
                  content={section.content}
                  imageUrl={imageUrl}
                  imagePosition={section.imagePosition}
                  imageHeight="tall"
                  alignment="center"
                  className={index > 0 ? "pt-0 md:pt-0 pb-0 md:pb-0" : ""}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM REGISTER BUTTON */}
      {webinarDetails && webinarDetails.length > 0 && webinarData?.cta && (
        <div className="flex justify-center py-12">
          <Link href={webinarData.cta?.href || ''}>
            <GoldButton>
              {webinarData.cta.title || 'Register here'}
            </GoldButton>
          </Link>
        </div>
      )}
    </div>
  );
}
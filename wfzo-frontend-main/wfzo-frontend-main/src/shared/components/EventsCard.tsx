"use client";

import GoldButton from './GoldButton';
import { usePathname, useRouter } from 'next/navigation';
import LightButton from './LightButton';

interface EventCTA {
  url: string | null;
  title: string | null;
  targetBlank?: boolean;
}

interface EventsCardProps {
  title: string;
  organization: string;
  location: string;
  description: string;
  date: string;
  image: string;
  isMobile?: boolean;
  variant?: 'horizontal' | 'vertical';
  cta?: EventCTA | null;
  extraClass?: string;
  singleItem?: boolean;
  cardUrl?: string;
  nav?: boolean;
}

export default function EventsCard({
  title,
  organization,
  location,
  description,
  date,
  image,
  isMobile = false,
  variant = 'horizontal',
  cta,
  extraClass = '',
  singleItem = false,
  cardUrl,
  nav = true,
}: EventsCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isEventsPage = typeof pathname === 'string' && pathname.includes('/events');
  const effectiveVariant: 'horizontal' | 'vertical' = isEventsPage ? 'vertical' : variant;
  const handleCardClick = () => {
    // Prefer navigating to internal details when cardUrl provided (Events page)
    const targetUrl = cardUrl || cta?.url || null;
    if (!targetUrl) return;
    const isInternal = targetUrl.startsWith('/');
    if (isInternal) {
      // Preserve current locale prefix from pathname if present (e.g., /en/...)
      const segs = (pathname || '').split('/').filter(Boolean);
      const localePrefix = segs.length > 0 && segs[0].length <= 5 ? `/${segs[0]}` : '';
      const href = targetUrl.startsWith(localePrefix) ? targetUrl : `${localePrefix}${targetUrl}`;
      router.push(href);
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderCTA = () => {
    if (!cta?.title) return null;
    const isInternal = (cta.url || '').startsWith('/');
    return (
      <>
        {nav ? <LightButton>{cta.title}</LightButton> :  <GoldButton>{cta.title}</GoldButton>}
        
       
      </>
    );
  };

  const imageClasses = `bg-gray-300 rounded-xl bg-cover bg-center transition-transform duration-300 ${effectiveVariant === 'horizontal' && !isMobile ? 'flex-1 h-full' : 'h-44'
    }`;

  const containerClasses = `cursor-pointer bg-white rounded-2xl shadow-wfzo transform transition-transform duration-600 ease-in-out p-4 ${isMobile
      ? 'space-y-4 hover:shadow-xl hover:shadow-wfzo-gold-light hover:scale-[1.02]'
      : effectiveVariant === 'horizontal'
        ? `flex gap-4 max-h-[514px] ${extraClass} hover:shadow-xl hover:shadow-wfzo-gold-light hover:scale-[1.02]`
        : `space-y-4 max-h-[514px] ${extraClass} hover:shadow-xl hover:shadow-wfzo-gold-light hover:scale-[1.02]`
    }`;

  const contentClasses = isMobile
    ? "space-y-4"
    : effectiveVariant === "horizontal"
      ? `flex-1 px-4 flex flex-col justify-between ${singleItem ? "w-full" : "max-w-[368px]"}`
      : "space-y-4";

  const descriptionClasses = `text-wfzo-grey-700 font-source ${effectiveVariant === 'horizontal' && !isMobile ? 'text-md line-clamp-4' : 'text-md line-clamp-3'
    }`;

  return (
    <div
      onClick={handleCardClick}
      className={containerClasses}
      style={{ minHeight: isMobile ? undefined : effectiveVariant === 'horizontal' ? 280 : 320 }}
    >
      <div className={imageClasses} style={{ backgroundImage: `url(${image})` }}></div>

      <div className={contentClasses}>
        <div>
          <h3 className="md:text-3xl font-source font-extrabold text-wfzo-grey-800 mb-1 h-[50px] md:h-[75px] line-clamp-2">
            {title}
          </h3>
          {isMobile ? (
            <>
              <div className="text-base font-source text-wfzo-grey-700 mb-2 ">{date}</div>
              <p className="text-wfzo-grey-700 font-source font-bold text-xs mb-1">{organization || '\u00A0'}</p>
              <p className="text-wfzo-grey-700 font-source text-xs mb-1">{location || '\u00A0'}</p>
              <p className={descriptionClasses}>{description || '\u00A0'}</p>
            </>
          ) : (
            <>
              <p className="text-wfzo-grey-700 font-source font-bold text-xs mb-1">{organization}</p>
              <p className="text-wfzo-grey-700 font-source text-xs mb-1">{location}</p>
              <p className={`${descriptionClasses} ${nav ? '!line-clamp-2 h-[48px] ' : ''}`}>
                {description || '\u00A0'}
              </p>
            </>
          )}
        </div>
        {!isMobile && (
          <div className={`space-y-4 ${variant === 'vertical' ? 'mt-2' : ''}`}>
            <div className="text-xl font-montserrat font-semibold text-wfzo-grey-800">{date}</div>
            <div className='min-h-[36px]'>
            {renderCTA()}
            </div>
          </div>
        )}
        {isMobile && <div className="mt-8 mb-2">{renderCTA()}</div>}
      </div>
    </div>
  );
}

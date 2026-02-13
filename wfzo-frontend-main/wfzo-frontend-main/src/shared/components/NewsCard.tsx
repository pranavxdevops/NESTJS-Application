"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/constants/constants';
import LightButton from './LightButton';
import { useEffect, useState } from "react";
import LightPressButton from './LightPressButton';
import { usePathname, useRouter } from 'next/navigation';



interface DocumentSection {
  id: number;
  href: string | null;
  downloadLabel: string;
  viewLabel: string;
}

interface NewsCardProps {
  id: number | string;
  title: string;
  category: string;
  categoryColor: { text: string; background: string };
  description: string;
  readTime: string;
  author: string;
  organization: string;
  image: string;
  document?: string;
  type?: string;
  publishedDate?: string;
  isLocked?: boolean | null;
  expandedCardId?: number | string | null;
  setExpandedCardId?: (id: number | string | null) => void;
  documentSection?: DocumentSection;
  url?: string; // deprecated: navigation handled by parent
  openInNewTab?: boolean; // deprecated
  authorImg?: string | null;
  onClick?: () => void; // custom click handler
}

export default function NewsCard({
  id,
  title,
  category,
  categoryColor,
  description,
  readTime,
  type,
  author,
  organization,
  image,
  document,
  isLocked = false,
  expandedCardId,
  setExpandedCardId,
  documentSection,
  publishedDate,
  url,
  authorImg,
  onClick,
}: NewsCardProps) {

  const [isMobile, setIsMobile] = useState(false);
  const isExpanded = isMobile ? true : (expandedCardId != null ? expandedCardId === id : false);

  const COLLAPSED_IMAGE_HEIGHT = 230;
  // const EXPANDED_IMAGE_HEIGHT = type === 'document' ? 205 : 180;
  const EXPANDED_IMAGE_HEIGHT =  180;
  const DESCRIPTION_HEIGHT = 45;
  const pathname = usePathname();
  const router = useRouter();
  const handleCardClick = () => {
    // If custom onClick is provided, use it instead of default navigation
    if (onClick) {
      onClick();
      return;
    }

    if (category === CATEGORIES.LIBRARY) return;
    // Prefer navigating to internal details when cardUrl provided (Events page)
    const targetUrl = url  || null;
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
 

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <motion.div
      layout
  onMouseEnter={!isMobile && setExpandedCardId ? () => setExpandedCardId(id) : undefined}
  onMouseLeave={!isMobile && setExpandedCardId ? () => setExpandedCardId(null) : undefined}
      onClick={handleCardClick}
      className={`bg-white rounded-2xl shadow-lg p-4 overflow-hidden relative font-source cursor-pointer min-h-[450px]`}
      animate={{
        scale: isExpanded ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Image */}
      {/* Image */}
<div
  className="rounded-xl bg-cover bg-center mb-3 relative overflow-hidden transition-[height] duration-300 ease-in-out"
  style={{
    backgroundImage: `url(${image})`,
    height: isExpanded
      ?  EXPANDED_IMAGE_HEIGHT
      : COLLAPSED_IMAGE_HEIGHT,
  }}
/>

      {/* Category + Lock */}
      <div className="flex items-center justify-between mb-2">
        <div
          className="flex items-center gap-2 px-2 py-1 rounded-xl"
          style={{ backgroundColor: categoryColor.background }}
        >
          {/* Icon */}
          <Image
            src={CATEGORY_ICONS[category] || '/file.svg'}
            alt="category icon"
            width={16}
            height={16}
          />
          <span className="text-xs font-medium" style={{ color: categoryColor.text }}>
            {category}
          </span>
        </div>
        {isLocked && (
          <Image src="/lock.svg" alt="Lock" width={16} height={16} />
        )}
      </div>

      {/* Title */}
      <h3
        className="font-bold text-gray-900 height:[20px] leading-5 mb-4 text-sm overflow-hidden text-ellipsis line-clamp-2"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {title}
      </h3>
      
      

      {/* Buttons and Author for Documents */}
      {type === 'document' && (
        <>
          {/* Published Date */}
      {type === 'document' ? (
        <p className="text-gray-600 text-xs mb-2 mt-1">
          {publishedDate
            ? new Date(publishedDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : ''}
        </p>
      ) : (
        ''
      )}

      {/* Read Time */}
      <p className="text-gray-600 text-xs mb-2 height:[16px]">
        {type === 'document' ? 'Downloadable PDF' : ''}
      </p>

          <div className="absolute left-4 bottom-1 right-4">
            {(author || organization) && (
              <div className="flex items-center gap-3 mb-3">
                {author && authorImg ? 
          (<Image src={authorImg} alt={author || "Author Avatar"} width={36} height={36} className='w-9 h-9 rounded-lg object-center' /> ): (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {author
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          )}
                <div>
                  <p className="text-gray-900 font-bold text-xs">{author}</p>
                  <p className="text-gray-600 text-xs">{organization}</p>
                </div>
              </div>
            )}
            {isExpanded && (
              <div
                className="flex gap-2 mb-3"
                style={{ pointerEvents: isLocked ? "none" : "auto" }}
              >
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/download?file=${document}`}
                  download
                  onClick={(e) => e.stopPropagation()}
                >
                  <LightPressButton>
                    <span className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px]">
                      {documentSection?.downloadLabel || "Download PDF"}
                    </span>
                    <Image src="/assets/download_gold.svg" alt="Download" width={20} height={20} />
                  </LightPressButton>
                </a>
                <a
                  href={document ?? "#"}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                >
                  <LightButton >
                    <span className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px]">
                      {documentSection?.viewLabel || "View"}
                    </span>
                    <Image src="/assets/eye_gold.svg" alt="View" width={20} height={20}/>
                  </LightButton>
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* Article-specific description */}
      { type === "article" && (
        <>
          <motion.div
            className="overflow-hidden"
            animate={{
              height: isExpanded ? DESCRIPTION_HEIGHT : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <p
              className="text-gray-700 text-xs leading-4"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '15px',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}
            >
              {description}
            </p>
          </motion.div>

          {/* Published Date outside motion div */}
          <p className="text-gray-600 text-xs mb-2 mt-2">
            {publishedDate
              ? new Date(publishedDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </p>

          {/* Read Time outside motion div */}
          <p className="text-gray-600 text-xs mb-2" style={{ minHeight: '16px' }}>
            {readTime}
          </p>
        </>
      )}

      {/* Author info at bottom for articles */}
      {type === "article" && (author || organization)&& (
        <div className="flex items-center gap-3 absolute bottom-4 left-4 right-4">
          {authorImg ? 
          (<Image src={authorImg} alt={author || "Author Avatar"} width={36} height={36} className='w-9 h-9 rounded-lg object-center' /> ): (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {author
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          )}
          <div>
            {author &&<p className="text-gray-900 font-bold text-xs">{author}</p>}
            {organization &&<p className="text-gray-600 text-xs">{organization}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

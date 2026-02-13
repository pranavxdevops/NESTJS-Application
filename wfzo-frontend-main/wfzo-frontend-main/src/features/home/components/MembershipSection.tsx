import { CONTENTHEADER_BG_IMAGE } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import GoldButton from '@/shared/components/GoldButton';
import React from 'react';
import Image from 'next/image';
import { Link } from 'i18n/navigation';
import { useAuth } from '@/lib/auth/EntraAuthProvider';

interface MembershipSectionProps {
  removeAbsolute?: boolean;
  className?: string;
  title?: string;
  description?: string;
  backgroundImage?: { url?: string } | null;
  cta?: {
    url: string;
    title: string;
    targetBlank?: boolean;
  };
}

export default function MembershipSection({
  removeAbsolute,
  className,
  title,
  description,
  backgroundImage,
  cta,
}: MembershipSectionProps) {
  const { isAuthenticated } = useAuth();
  const imageUrl = backgroundImage?.url
    ? getStrapiMediaUrl(backgroundImage.url, CONTENTHEADER_BG_IMAGE)
    : CONTENTHEADER_BG_IMAGE;
  return (
    <div
      className={`${
        removeAbsolute
          ? 'relative mx-auto'
          : 'absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2'
  } z-30 w-full max-w-[calc(100%-80px)] ${className || ''}`}
    >
      <div className="mx-auto bg-[#FCFAF8] rounded-[28px] lg:rounded-[40px] shadow-2xl py-15 px-5 md:px-20 border border-wfzo-gold-200/20 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-100 pointer-events-none">
          <Image src={imageUrl} alt="World map" fill className="object-cover" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-4">
          <h3 className="text-2xl md:text-3xl lg:text-6xl font-montserrat font-black text-wfzo-grey-900">
            {title}
          </h3>
          <p className="max-w-3xl mx-auto text-wfzo-grey-800 font-source text-base leading-relaxed">
            {description}
          </p>
          {!isAuthenticated && cta?.url && (
            <div className="flex justify-center">
              <Link
                href={cta.url || '/' as any}
                target={cta.targetBlank ? "_blank" : ""}
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <GoldButton>{cta.title || 'Join Us'}</GoldButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

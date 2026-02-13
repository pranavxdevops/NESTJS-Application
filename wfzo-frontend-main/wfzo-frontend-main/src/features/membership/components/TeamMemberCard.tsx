'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import ThreeDotsMoreAction from '@/shared/components/MoreActionsMenu';
import MoreActionsMenu from '@/shared/components/MoreActionsMenu';

interface TeamMemberCardProps {
  name: string;
  designation: string;
  email?: string;
  phone?: string;
  imageUrl: any; 
  
   isMember: boolean;
}

export default function TeamMemberCard({
  name,
  designation,
  email,
  phone,
  imageUrl,
  isMember,
}: TeamMemberCardProps) {
 
  const textRef = useRef<HTMLDivElement>(null);
  const [textHeight, setTextHeight] = useState(0);

 const [imgSrc, setImgSrc] = useState(
  typeof imageUrl === 'string' && imageUrl.trim()
    ? imageUrl
    : FALLBACK_IMAGE
);  

  useEffect(() => {
    if (textRef.current) {
      setTextHeight(textRef.current.scrollHeight);
    }
  }, [name, designation, email, phone]);

  // SAME imageBasis logic
  const imageBasis = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'auto';
    
    if (textHeight > 150) return '50%';
    if (textHeight > 100) return '65%';
    if (textHeight > 50) return '70%';
    return '70%';
  }, [ textHeight]);

  return (
    <div
      className="group bg-white rounded-2xl shadow-wfzo w-full 
             h-[420px] md:h-[480px] lg:h-[512px] 2xl:h-[650px]
             p-4 transition-all duration-500 transform 
             md:hover:scale-103 font-source relative"
      
    >
      <div className="relative flex flex-col h-full">
        {/* Image Wrapper (controls popup positioning) */}
        <div
          className="relative"
          style={{
            flexBasis: imageBasis,
            height: '240px',
          }}
        >
          {/* Image (still clipped) */}
          <div className="relative overflow-hidden rounded-2xl h-full">
            <Image
              src={imgSrc}
              alt={name}
              fill
              onError={() => setImgSrc(FALLBACK_IMAGE)}
              className="object-cover object-top rounded-2xl transition-all duration-500"
              sizes="(max-width: 768px) 90vw, 33vw"
            />
          </div>

          {/* ✅ Popup can escape now */}
          {isMember && (
          <MoreActionsMenu
            onMessage={() => console.log('Message member')}
            onReport={() => console.log('Report / Block member')}
          />)}
        </div>

        {/* Content Section */}
        <div
          ref={textRef}
          className={`
            flex flex-col justify-between py-2 min-h-0
            ${
              textHeight > 150
                ? 'gap-1'
                : textHeight > 100
                  ? 'gap-2'
                  : textHeight > 70
                    ? 'gap-3'
                    : textHeight > 50
                      ? 'gap-4'
                      : 'gap-5'
            }
          `}
        >
          <div>
            <h3
              className="font-bold text-gray-900 my-1"
              style={{
                fontSize: 'clamp(0.85rem, 1.2vw, 1.5rem)',
                lineHeight: 'clamp(1.1rem, 1.5vw, 2rem)',
              }}
            >
              {name}
            </h3>

            <p
              className="text-gray-700 text-justify line-clamp-2"
              style={{
                fontSize: 'clamp(0.65rem, 0.9vw, 0.875rem)',
              }}
            >
              <strong>{designation}</strong>
            </p>

            {email && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Mail className="w-4 h-4" />
                {email}
              </div>
            )}

            {phone && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Phone className="w-4 h-4" />
                {phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

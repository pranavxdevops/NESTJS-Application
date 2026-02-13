'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LinkedInButton from '@/shared/components/LinkedInButton';
import LightPressButton from '@/shared/components/LightPressButton';

interface FoundingMemberCardProps {
  name: string;
  role: string;
  bio?: string;
  imageUrl: string;
  linkedinUrl?: string;
  description?: string;
  memberUrl?: string;
  organisationDesignation?: string;
}

export default function FoundingMemberCard({
  name,
  role,
  imageUrl,
  linkedinUrl,
  description,
  memberUrl,
  organisationDesignation,
}: FoundingMemberCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [textHeight, setTextHeight] = useState(0);

  const isMemberUrlAvailable = memberUrl && memberUrl.trim() !== '';

  useEffect(() => {
    if (textRef.current) {
      setTextHeight(textRef.current.scrollHeight);
    }
  }, [name, role, organisationDesignation, description]);

  // Only apply dynamic image ratio on md+ screens, keep fixed height on mobile
  const imageBasis = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'auto';
    if (!isHovered) return '75%';
    if (!isMemberUrlAvailable) return '70%';
    if (textHeight > 150) return '50%';
    if (textHeight > 100) return '65%';
    if (textHeight > 50) return '70%';
    return '70%';
  }, [isHovered, textHeight, isMemberUrlAvailable]);

  const handleCardClick = () => {
    if (memberUrl) router.push(memberUrl);
  };

  return (
    <div
      className="group bg-white rounded-2xl shadow-wfzo w-full 
                 h-[420px] md:h-[480px] lg:h-[512px] 2xl:h-[650px]
                 p-4 overflow-hidden transition-all duration-500 transform 
                 md:hover:scale-103 font-source cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex flex-col h-full" onClick={handleCardClick}>
        {/* Image Section */}
        <div
          className="relative transition-all duration-500 overflow-hidden rounded-2xl"
          style={{
            flexBasis: imageBasis,
            height: '240px', // ✅ Fixed height for mobile
          }}
        >
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover object-top rounded-2xl transition-all duration-500"
            sizes="(max-width: 768px) 90vw, 33vw"
          />
        </div>

        {/* Content Section */}
        <div
          ref={textRef}
          className={`
            flex flex-col justify-between py-2 min-h-0
            ${textHeight > 150 ? 'gap-1' :
              textHeight > 100 ? 'gap-2' :
              textHeight > 70 ? 'gap-3' :
              textHeight > 50 ? 'gap-4' : 'gap-5'}
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

            {description ? (
              <p
                className="text-gray-700 line-clamp-2 text-justify"
                style={{
                  fontSize: 'clamp(0.65rem, 1vw, 1.1rem)',
                  lineHeight: 'clamp(0.9rem, 1.2vw, 1.5rem)',
                }}
              >
                {description}
              </p>
            ) : (
              <p
                className="text-gray-700 text-justify line-clamp-2"
                style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.875rem)' }}
              >
                <strong>{role}</strong>
              </p>
            )}

            {organisationDesignation && (
              <p
                className="text-gray-700 text-justify line-clamp-3"
                style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.875rem)' }}
              >
                {organisationDesignation}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div
          className={`absolute bottom-0 left-0 flex items-center justify-between gap-2.5 w-[98%] pt-2 
                      transition-opacity duration-300 md:flex min-h-[48px] opacity-100 md:opacity-0
                      ${isHovered ? 'md:opacity-100' : ''}`}
        >
          {isMemberUrlAvailable && (
            <LightPressButton
              // onClick={handleCardClick}
              aria-label={`Read more about ${name}`}
            >
              Read more
            </LightPressButton>
          )}
          {linkedinUrl && <LinkedInButton url={linkedinUrl} />}
        </div>
      </div>
    </div>
  );
}

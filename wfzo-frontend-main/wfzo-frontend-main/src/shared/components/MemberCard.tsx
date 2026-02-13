'use client';

// @ts-ignore
import Flag from 'react-world-flags';
import Image from 'next/image';
import { trackMemberView } from '@/lib/analytics/gtag';
import { useAutoRefreshUrl } from '@/lib/blob';

interface Member {
  id: number;
  name: string;
  logo: string;
  logoExpiresAt?: string;
  logoExpiresIn?: number;
  flag: string;
  industries: string[]; // <-- new field for industries
  countryName?: string;
}

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
}

export default function MemberCard({ member, onClick }: MemberCardProps) {
  const handleClick = () => {
    // Track member view
    trackMemberView(
      member.id.toString(), 
      member.name, 
      member.countryName || 'Unknown'
    );
    onClick?.();
  };

  // Use auto-refresh for logo if metadata is available
  const logoUrlData = member.logoExpiresAt 
    ? { url: member.logo, expiresAt: member.logoExpiresAt, expiresIn: member.logoExpiresIn }
    : member.logo;
  
  const { url: logoUrl } = useAutoRefreshUrl(logoUrlData, {
    // Auto-refresh disabled for list views to avoid too many requests
    // The signed URL has 12h validity, sufficient for typical browsing sessions
    autoRefresh: false,
  });

  // Debug logging
  if (member.id === 1 || member.logo) {
    console.log('MemberCard Debug:', {
      memberId: member.id,
      memberName: member.name,
      originalLogo: member.logo,
      logoExpiresAt: member.logoExpiresAt,
      logoUrlData,
      finalLogoUrl: logoUrl,
    });
  }

  // Use unoptimized images for external URLs with SAS tokens to avoid encoding issues
  const isExternalUrl = logoUrl?.startsWith('http');
  
  return (
    <div 
      onClick={handleClick}
      className={`bg-white rounded-[20px] h-[240px] flex flex-col relative group 
    transition-transform duration-300 shadow-[0_10px_32px_-4px_rgba(139,105,65,0.1),0_6px_14px_-6px_rgba(139,105,65,0.12)] hover:scale-105
    hover:shadow-[0_16px_40px_-2px_rgba(139,105,65,0.08),0_8px_24px_-8px_rgba(139,105,65,0.10)] transform-gpu origin-center p-4 pt-10 cursor-pointer`}
    >
      <div className="absolute top-4 left-4 z-20">
        <Flag code={member.flag} style={{ width: 21, height: 15, borderRadius: 4 }} />
      </div>
      <div className="flex flex-col items-center justify-center h-[120px] w-[80%] mx-auto group-hover:h-[105px] transition-all duration-300">
        {isExternalUrl ? (
          // Use img tag for external URLs with SAS tokens to avoid Next.js encoding issues
          <img
            src={logoUrl || '/assets/fallback-logo.png'}
            alt={member.name}
            className="h-full w-auto object-contain rounded-lg max-w-full
                 transition-transform duration-300 ease-in-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/fallback-logo.png';
            }}
          />
        ) : (
          <Image
            src={logoUrl || '/assets/fallback-logo.png'}
            alt={member.name}
            width={250}
            height={120}
            className="h-full w-auto object-contain rounded-lg 
                 transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        )}
      </div>

      <div className="mt-1 min-h-[40px] flex items-center text-left">
        <p className="text-[#1A1A1A] font-source font-bold text-[16px] leading-[20px]">
          {member.name}
        </p>
      </div>
      <div
        className={` mt-auto flex flex-wrap items-center gap-2 mb-2 transition-all duration-300 opacity-100 translate-y-0 pointer-events-auto lg:opacity-0 lg:pointer-events-none lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0`}
      >
        {member.industries.slice(0, 2).map((industry, index) => (
          <span
            key={index}
            className="bg-[#F1E9E0] text-[#6B4F2A] text-[12px] font-source px-[6px] py-[4px] rounded-[12px] "
          >
            {industry}
          </span>
        ))}
        {member.industries.length > 2 && (
          <span className="text-[#333333] text-xs font-source px-[6px] py-[4px] rounded-[12px]">
            +{member.industries.length - 2} more
          </span>
        )}
      </div>
    </div>
  );
}

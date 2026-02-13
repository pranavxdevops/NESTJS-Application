import ContentHeader from '@/shared/components/ContentHeader';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
type MembershipType = {
  label: string;
  info?: string;
  // Optional icon sources:
  iconKey?: string;
  iconPath?: string; // inline SVG path data
  iconUrl?: string; // external image/icon URL
};

export default function MembershipTypesSection({
  title,
  description,
  memberTypes = [],
}: {
  title?: string;
  description?: string;
  memberTypes?: MembershipType[];
}) {
   const iconMap: Record<string, string> = {
    votingMember: '/assets/voting_member.svg',
    associateMember: '/assets/associate_member.svg',
    'partner&Observer': '/assets/partner_observer.svg',
   };
  return (
    <div className="py-10 md:py-20 px-5 md:px-30 flex flex-col items-start">
      <ContentHeader header={title || 'Types of Membership'} description={description || ''} pageHeading={false} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
        {memberTypes.map((type, index) => (
          <Link
            key={index}
            href={{ query: { membershipTab: type.label }, hash: 'member-details' }}
            className="flex flex-col items-start gap-2.5 flex-1 h-[340px] p-6 pb-8 rounded-[20px] transition-transform bg-white shadow-wfzo hover:scale-105 hover:shadow-[0_16px_40px_-2px_rgba(139,105,65,0.08),0_8px_24px_-8px_rgba(139,105,65,0.10)] transform-gpu"
          >
            <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
              {/* Icon */}
              {type.iconKey && iconMap[type.iconKey] && (
                <Image
                  src={iconMap[type.iconKey]}
                  alt={type.label}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              )}

              <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
                <div className="flex flex-col items-start gap-3 flex-1 self-stretch">
                  <h3 className="text-wfzo-grey-900 font-montserrat text-2xl font-bold leading-8 self-stretch">
                    {type.label}
                  </h3>
                  <p className="flex-1 overflow-hidden text-wfzo-grey-700 font-source text-base font-normal leading-6">
                    {type.info}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1 p-2 pl-4 rounded-sm">
                  <span className="text-wfzo-gold-600 font-source text-base font-semibold leading-6 underline">
                    Learn more
                  </span>
                  <ArrowRight className="w-6 h-6 text-wfzo-gold-600" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

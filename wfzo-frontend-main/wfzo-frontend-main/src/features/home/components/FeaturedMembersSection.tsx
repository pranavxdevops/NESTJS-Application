import React from 'react';
import MemberCard from '@/shared/components/MemberCard';
import members from '@/shared/data/featuredMembers.json';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';

interface FeaturedMembersSectionProps {
  id?: number;
  title: string;
  summary: string;
  cta?: {
    href: string | null;
    title: string | null;
    targetBlank: boolean;
    variant: 'PRIMARY' | 'LINK';
    type: 'internal' | 'external';
    internalLink: string | null;
  } | null;
}

export default function FeaturedMembersSection({
  title,
  summary,
  cta,
}: FeaturedMembersSectionProps) {
  return (
    <AdvancedCarousel
      itemsCount={members.length}
      title={title}
      description={summary}
      pageHeading={false}
      // headerCta={cta}
      visibleSlides={{
        xs: 1.2, // 1 card on mobile
        sm: 2, // 2 cards on small tablets
        md: 2, // 3 cards on tablets
        lg: 3, // 4 cards on desktop
        xl: 4, // 4 cards on large desktop
      }}
      slidesToScroll={1} // Scroll 1 card at a time
      autoplay={true}
      autoplayDelay={5000}
      loop={true}
      showControls={true}
      showProgressBar={true}
      containerClassName="px-5 md:px-30 py-10 md:py-20"
      gap={12} // 16px gap between cards
    >
      {members.map((member: any, idx: number) => (
        <div key={idx} className="h-full mb-6">
          <MemberCard member={member} />
        </div>
      ))}
    </AdvancedCarousel>
  );
}

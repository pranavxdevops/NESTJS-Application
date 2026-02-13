import React from 'react';
import Link from 'next/link';
import { IndustryItem } from '@/shared/components/IndustryItem';
import industries from '@/shared/data/industries.json';
// --- Types based on your Strapi response ---
interface InternalLink {
  id: number;
  documentId: string;
  title: string;
  slug: string;
}

interface CTA {
  id: number;
  href: string | null;
  title: string;
  targetBlank: boolean;
  variant: string;
  type: 'internal' | 'external';
  internalLink?: InternalLink;
}

interface Industry {
  id: number;
  name: string;
  isActive: boolean;
}

interface IndustriesSectionProps {
  title: string;
  cta?: CTA;
}

export default function IndustriesSection({ title = 'Industries', cta }: IndustriesSectionProps) {
  const primaryCTA = cta;

  // resolve link
  const linkHref = cta?.href

  return (
    <section className="py-10 md:py-20 bg-[#FCFAF8]">
      <div className="mx-auto px-5 md:px-30">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10">
          {<Link
              href={`${linkHref}#members-section` || '/' as any}>
          <h2 className="text-3xl md:text-6xl font-montserrat font-black text-wfzo-grey-900">
            {title}
          </h2>
          </Link>}
          {primaryCTA && (
            <Link
              href={`${linkHref}#members-section`|| '/' as any}
              target={primaryCTA.targetBlank ? "_blank" : "_self"}
              className="text-[#8F713F] font-source font-bold underline hover:text-wfzo-gold-600"
            >
              {primaryCTA.title}
            </Link>
          )}
        </div>

        {/* Industries Grid - Desktop */}
        <div className="hidden md:block">
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 px-6">
            {industries.map((industry) => (
              <IndustryItem key={industry.name} name={industry.name} isActive={industry.isActive} />
            ))}
          </div>
        </div>

        {/* Industries Grid - Mobile */}
        <div className="md:hidden">
          <div className="flex flex-wrap justify-center items-center gap-4 px-7">
            {industries.map((industry) => (
              <IndustryItem
                key={industry.name}
                name={industry.name}
                isActive={industry.isActive}
                isMobile
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Markdown from '@/shared/components/Markdown';
import ContentHeader from '@/shared/components/ContentHeader';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import LightPressButton from '@/shared/components/LightPressButton';
import LightButton from '@/shared/components/LightButton';
import React from 'react';

type MemberTypeItem = {
  label: string;
  info?: string | null;
  iconKey?: string | null;
  value?: number | string | null;
  description?: string | null;
  image?: string | '';
};

function MemberShipDetailsSection({
  memberTypes = [],
  title,
  onSelectMembership
}: {
  memberTypes?: MemberTypeItem[];
  title?: string;
  onSelectMembership: (membership: string) => void;
}) {
  const labelsFromData = useMemo(
    () => memberTypes.map((m) => m.label).filter(Boolean),
    [memberTypes]
  );
  const defaultTab = labelsFromData[0] || 'Voting Member';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const searchParams = useSearchParams();

  const tabs = useMemo(
    () =>
      labelsFromData.length
        ? labelsFromData
        : ['Voting Member', 'Associate Member', 'Partner & Observer Member'],
    [labelsFromData]
  );

  useEffect(() => {
    const tab = searchParams.get('membershipTab');
    if (tab) {
      const match = tabs.find((t) => t.toLowerCase() === tab.toLowerCase());
      if (match) {
        setActiveTab(match);
        return;
      }
    }
    // Fallback to first available tab from data
    setActiveTab(labelsFromData[0] || defaultTab);
  }, [searchParams, tabs, labelsFromData, defaultTab]);

  const activeItem = useMemo(
    () => memberTypes.find((m) => m.label === activeTab),
    [memberTypes, activeTab]
  );

  

  return (
    <div id="member-details" className="px-5 md:px-30 flex flex-col items-start gap-6">
      {/* Tabs */}
      {/* Tabs */}
    <div className="w-full overflow-x-auto scrollbar-hidden">
      <div className="flex gap-2 items-center rounded min-w-max">
        {tabs.map((tab) =>
          activeTab === tab ? (
            <LightPressButton
              key={tab}
              onClick={() => setActiveTab(tab)}
              baseClassName="rounded-[11px] px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base whitespace-nowrap flex-shrink-0"
            >
              {tab}
            </LightPressButton>
          ) : (
            <LightButton
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="
                font-source
                text-[#4D4D4D] rounded-[11px] px-2 py-1.5 
                hover:text-wfzo-gold-600
                hover:bg-wfzo-gold-100 hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] 
                transition-all duration-300 ease-in-out 
                text-sm md:text-base md:px-3 md:py-2 
                whitespace-nowrap flex-shrink-0
              "
            >
              {tab}
            </LightButton>
          )
        )}
      </div>
    </div>


      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full">
        {/* Text / Main column */}
        <div className="flex flex-col items-start flex-1">
          <ContentHeader header={activeTab} description={''} pageHeading={false} />

          {/* Mobile image (below title, above description) */}
          <div className="block lg:hidden w-full h-[240px] sm:h-[300px] md:h-[340px] rounded-4xl bg-wfzo-grey-300 relative overflow-hidden">
            <Image
              src={activeItem?.image || FALLBACK_IMAGE}
              alt={(title ? `${title} ` : '') + 'image'}
              fill
              className="object-cover object-top py-2  rounded-4xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="text-wfzo-grey-700 font-source text-base leading-6 space-y-4 w-full">
            <Markdown
              content={activeItem?.description || 'Details coming soon.'}
              allowHtml
              allowInlineStyles
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-6 mt-6 py-2 rounded-[11px] bg-wfzo-gold-600 text-white font-source text-base font-semibold shadow-sm hover:bg-wfzo-gold-700 transition-colors"
          onClick={() => {
            let normalized = activeTab;

            // Only fix this one case
            if (activeTab.toLowerCase().includes("partner")) {
              normalized = "Partner and Observer";
            }

            onSelectMembership(normalized);
          }}
          >
            Sign up
          </button>
        </div>

        {/* Desktop / Large screen image */}
        <div className="hidden lg:flex flex-1 h-[280px] sm:h-[360px] md:h-[420px] lg:h-[520px] xl:h-[568px] rounded-4xl bg-wfzo-grey-300 relative overflow-hidden">
          <Image
            src={activeItem?.image || FALLBACK_IMAGE}
            alt={(title ? `${title} ` : '') + 'image'}
            fill
            className="object-cover object-top py-4 rounded-4xl"
            sizes="50vw"
            priority
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(MemberShipDetailsSection);
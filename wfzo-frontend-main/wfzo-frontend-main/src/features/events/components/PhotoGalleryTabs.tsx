'use client';

import { useEffect, useMemo, useState } from 'react';
import GridSection from '@/features/about/components/GridSection';
import MediaEventCard from '@/shared/components/MediaEventCard';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';

export type PhotoEvent = {
  type: "event" | "webinar" | "individual";
  title?: string;
  organization?: string;
  location?: string;
  image?: string;
  startDateTime?: string | null;
  endDateTime?: string | null;
  slug?: string;
  cardUrl: string;
};

type PhotoCardProps = {
  title: string;
  organization: string;
  location: string;
  image: string;
  date: string;
  cardUrl?: string;
};

type PhotoGalleryTabsProps = {
  events: PhotoEvent[];
};

const DEFAULT_VISIBLE_COUNT = 18;
const LOAD_MORE_STEP = 18;

function formatRange(start?: string | null, end?: string | null) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  if (s && e) return `${fmt(s)} - ${fmt(e)}`;
  if (s) return fmt(s);
  return '';
}

function deriveEventYear(event: PhotoEvent) {
  if (event.startDateTime) {
    const d = new Date(event.startDateTime);
    if (!isNaN(d.getTime())) return d.getFullYear().toString();
  }
  return "Other";
}

function toCardProps(event: PhotoEvent): PhotoCardProps {
  return {
    title: event.title || '',
    organization: event.organization || '',
    location: event.location || '',
    image: event.image || '',
    date: formatRange(event.startDateTime ?? null, event.endDateTime ?? null),
    cardUrl: event.cardUrl,
  };
}

export default function PhotoGalleryTabs({ events }: PhotoGalleryTabsProps) {
  const groupedByYear = useMemo(() => {
    const map = new Map<string, PhotoEvent[]>();
    events.forEach((ev) => {
      const year = deriveEventYear(ev);
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(ev);
    });
    return map;
  }, [events]);

  const orderedYears = useMemo(() => {
    return [...groupedByYear.keys()]
      .filter((y) => y !== "Other")
      .sort((a, b) => Number(b) - Number(a));
  }, [groupedByYear]);

  const tabOptions = useMemo(() => {
    return [{ label: "All", value: "all" }].concat(
      orderedYears.map((y) => ({ label: y, value: y }))
    );
  }, [orderedYears]);

  const [activeTab, setActiveTab] = useState(tabOptions[0].value);

  useEffect(() => {
    if (!tabOptions.some((t) => t.value === activeTab)) {
      setActiveTab(tabOptions[0].value);
    }
  }, [tabOptions, activeTab]);

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const eventsForActiveTab =
    activeTab === "all"
      ? events
      : groupedByYear.get(activeTab) ?? [];

  const hasMore = eventsForActiveTab.length > visibleCount;

  return (
    <div className="px-5 md:px-30 pt-5 pb-10 md:pb-20 flex flex-col gap-6">

      <ScrollableTabs
        options={tabOptions}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {eventsForActiveTab.length === 0 ? (
        <p className="text-wfzo-grey-700">No photos available.</p>
      ) : activeTab === "all" ? (
        /* ------------------- GROUPED + LIMITED (LIKE PastEventsTabs) ------------------- */
        <div className="flex flex-col gap-10">
          {(() => {
            let remaining = visibleCount; // how many items left to display
            const sections: Array<{ year: string; cards: PhotoCardProps[] }> = [];

            for (const year of [...orderedYears, "Other"]) {
              if (remaining <= 0) break;

              const yearEvents = groupedByYear.get(year) ?? [];
              const limited = yearEvents.slice(0, remaining);
              const cards = limited.map(toCardProps);

              if (cards.length > 0) {
                sections.push({ year, cards });
              }

              remaining -= cards.length;
            }

            return sections.map(({ year, cards }) => (
              <GridSection
                key={year}
                heading={year !== "Other" ? year : ""}
                members={cards}
                CardComponent={MediaEventCard}
                items={3}
                className="!p-0"
              />
            ));
          })()}
        </div>
      ) : (
        /* ------------------- SINGLE YEAR VIEW ------------------- */
        <GridSection
          heading={activeTab}
          members={eventsForActiveTab
            .slice(0, visibleCount)
            .map(toCardProps)}
          CardComponent={MediaEventCard}
          items={3}
          className="!p-0"
        />
      )}

      {hasMore && (
        <div className="flex justify-center">
          <GoldButton onClick={() => setVisibleCount((v) => v + LOAD_MORE_STEP)}>
            Load More
          </GoldButton>
        </div>
      )}
    </div>
  );
}

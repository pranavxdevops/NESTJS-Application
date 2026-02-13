'use client';

import { useEffect, useMemo, useState } from 'react';
import GridSection from '@/features/about/components/GridSection';
import EventsCard from '@/shared/components/EventsCard';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';

export type NormalizedEvent = {
  title?: string;
  organization?: string;
  location?: string;
  description?: string;
  image?: string;
  startDateTime?: string | null;
  endDateTime?: string | null;
  cta?: {
    url?: string | null;
    href?: string | null;
    title: string | null;
    targetBlank?: boolean;
  } | null;
  slug?: string;
};

type GridEventCardProps = {
  title: string;
  organization: string;
  location: string;
  description: string;
  image: string;
  date: string;
  cta?: { url: string | null; title: string | null; targetBlank?: boolean } | null;
  cardUrl?: string;
};

type PastEventsTabsProps = {
  events: NormalizedEvent[];
  isPast?: boolean;
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
  if (e) return fmt(e);
  return '';
}

function deriveEventYear(event: NormalizedEvent) {
  if (event.startDateTime) {
    return new Date(event.startDateTime).getFullYear().toString();
  }
  if (event.endDateTime) {
    return new Date(event.endDateTime).getFullYear().toString();
  }
  return 'Other';
}
export default function PastEventsTabs({ events , isPast = true }: PastEventsTabsProps) {

function toCardProps(event: NormalizedEvent): GridEventCardProps {
  return {
    title: event.title || '',
    organization: event.organization || '',
    location: event.location || '',
    description: event.description || '',
    image: event.image || '',
    date: formatRange(event.startDateTime ?? null, event.endDateTime ?? null),
    cta: event?.cta
      ? {
          title: isPast ?  "Learn more" : event.cta?.title ?? null,
          url: ( null) as string | null,
          targetBlank: event.cta?.targetBlank,
        }
      : null,
    cardUrl: isPast && event?.slug 
  ? `/events/past-events/${event.slug}` 
  : `/events/upcoming-events/${event.slug}`,
  };
}

  const groupedByYear = useMemo(() => {
    const map = new Map<string, NormalizedEvent[]>();
    events.forEach((event) => {
      const year = deriveEventYear(event);
      if (!map.has(year)) {
        map.set(year, []);
      }
      map.get(year)!.push(event);
    });
    return map;
  }, [events]);

  const orderedYears = useMemo(() => {
  const keys = Array.from(groupedByYear.keys());
  return keys.sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNumber = Number.isFinite(aNum);
    const bIsNumber = Number.isFinite(bNum);

    if (aIsNumber && bIsNumber) {
      // 👇 If isPast = true → descending, else ascending
      return isPast ? bNum - aNum : aNum - bNum;
    }

    // Always put numeric years before text labels (like "Upcoming")
    if (aIsNumber && !bIsNumber) return -1;
    if (!aIsNumber && bIsNumber) return 1;

    // For text values, always sort alphabetically
    return a.localeCompare(b);
  });
}, [groupedByYear, isPast]);


  const tabOptions = useMemo(() => {
    const base = [{ label: 'All', value: 'all' }];
    const yearOptions = orderedYears.map((year) => ({ label: year, value: year }));
    return base.concat(yearOptions);
  }, [orderedYears]);

  const [activeTab, setActiveTab] = useState(() => tabOptions[0]?.value ?? 'all');
  useEffect(() => {
    if (!tabOptions.some((option) => option.value === activeTab)) {
      setActiveTab(tabOptions[0]?.value ?? 'all');
    }
  }, [tabOptions, activeTab]);

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const allEvents = events;
  const eventsForActiveTab = useMemo(() => {
    if (activeTab === 'all') {
      return allEvents;
    }
    return groupedByYear.get(activeTab) ?? [];
  }, [activeTab, allEvents, groupedByYear]);

  const visibleEvents = useMemo(
    () => eventsForActiveTab.slice(0, Math.min(visibleCount, eventsForActiveTab.length)),
    [eventsForActiveTab, visibleCount]
  );

  const membersForGrid = useMemo(() => visibleEvents.map(toCardProps), [visibleEvents]);

  const hasMore = eventsForActiveTab.length > visibleEvents.length;

  const activeLabel = useMemo(() => {
    const match = tabOptions.find((option) => option.value === activeTab);
    return match?.label ?? '';
  }, [tabOptions, activeTab]);

  return (
    <div className="px-5 md:px-30 py-0 md:py-0 flex flex-col gap-6">
      {isPast && 
      <ScrollableTabs options={tabOptions} value={activeTab} onValueChange={setActiveTab} />
      }
      {eventsForActiveTab.length === 0 ? (
          <p className="text-wfzo-grey-700">
            No past events available for {activeLabel || 'this selection'}.
          </p>
        ) : activeTab === 'all' ? (
          // 🔹 Grouped view for "All" tab
          <div className="flex flex-col gap-10">
            {orderedYears.length === 0 && (
              <p className="text-wfzo-grey-700">No past events available.</p>
            )}

            {(() => {
              // Calculate how many events to show across all years
              let remainingToShow = visibleCount;
              const yearsToDisplay: Array<{ year: string; events: GridEventCardProps[] }> = [];

              // Iterate through years and collect events up to visibleCount
              for (const year of orderedYears) {
                if (remainingToShow <= 0) break;

                const list = groupedByYear.get(year) ?? [];
                const eventsToTake = list.slice(0, remainingToShow);
                const membersWithUrl = eventsToTake.map(toCardProps);

                if (membersWithUrl.length > 0) {
                  yearsToDisplay.push({ year, events: membersWithUrl });
                  remainingToShow -= eventsToTake.length;
                }
              }

                return yearsToDisplay.map(({ year, events }) => (
                  <GridSection
                    key={year}
                    heading={year}
                    members={events}
                    CardComponent={EventsCard}
                    items={3}
                    className="!p-0"
                  />
                ));
              })()}
          </div>
        ) : (
          // 🔹 Normal view for a specific year tab
          <GridSection
            heading={activeLabel}
            members={membersForGrid}
            CardComponent={EventsCard}
            items={3}
            className="!p-0"
          />
        )}

      {hasMore && (
        <div className="flex justify-center">
          <GoldButton onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}>
            Load More
          </GoldButton>
        </div>
      )}
    </div>
  );
}

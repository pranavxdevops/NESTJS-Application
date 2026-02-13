'use client';

import { useEffect, useMemo, useState } from 'react';
import GridSection from '@/features/about/components/GridSection';
import MediaEventCard from '@/shared/components/MediaEventCard';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';

export type VideoEvent = {
  type: 'event' | 'webinar' | 'individual';
  title: string;
  organization: string;
  location: string;
  thumbnail: string;
  startDateTime: string | null;
  endDateTime?: string | null;
  slug?: string;
  cardUrl: string;
  // videoUrls?: string[];
};

const DEFAULT_VISIBLE_COUNT = 18;
const LOAD_MORE_STEP = 18;

function deriveEventYear(event: VideoEvent) {
  if (event.startDateTime) {
    const d = new Date(event.startDateTime);
    if (!isNaN(d.getTime())) return d.getFullYear().toString();
  }
  return 'Other';
}

function formatRange(start?: string | null, end?: string | null) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e) return `${fmt(s)} - ${fmt(e)}`;
  if (s) return fmt(s);
  return '';
}

export default function VideoGalleryTabs({ events }: { events: VideoEvent[] }) {
  const groupedByYear = useMemo(() => {
    const map = new Map<string, VideoEvent[]>();
    events.forEach((ev) => {
      const year = deriveEventYear(ev);
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(ev);
    });
    return map;
  }, [events]);

  const orderedYears = useMemo(() => {
    return [...groupedByYear.keys()]
      .filter((y) => y !== 'Other')
      .sort((a, b) => Number(b) - Number(a));
  }, [groupedByYear]);

  const tabOptions = useMemo(() => {
    return [{ label: 'All', value: 'all' }].concat(
      orderedYears.map((y) => ({ label: y, value: y }))
    );
  }, [orderedYears]);

  const [activeTab, setActiveTab] = useState(tabOptions[0]?.value || 'all');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const eventsForActiveTab = activeTab === 'all' ? events : groupedByYear.get(activeTab) ?? [];

  // Correct hasMore: total events in current view vs visible count
  const totalEventsInView = activeTab === 'all' ? events.length : eventsForActiveTab.length;
  const hasMore = totalEventsInView > visibleCount;

  // Reusable card mapper
  const mapEventToCard = (event: VideoEvent) => ({
    title: event.title,
    organization: event.organization,
    location: event.location,
    image: event.thumbnail,
    date: formatRange(event.startDateTime, event.endDateTime),
    cardUrl: event.cardUrl,
    // onImageClick: () => handleVideoClick(event.videoUrls || []),
  });

  return (
    <div className="px-5 md:px-30 pt-5 pb-10 md:pb-20 flex flex-col gap-6">
      <ScrollableTabs options={tabOptions} value={activeTab} onValueChange={setActiveTab} />

      {events.length === 0 ? (
        <p className="text-wfzo-grey-700 text-center py-20">No videos available.</p>
      ) : activeTab === 'all' ? (
        /* "All" tab → Year-wise sections with Load More across years */
        <div className="flex flex-col gap-12">
          {(() => {
            let remaining = visibleCount;
            const sections: { year: string; cards: any[] }[] = [];

            for (const year of [...orderedYears, 'Other']) {
              if (remaining <= 0) break;

              const yearEvents = groupedByYear.get(year) ?? [];
              const take = Math.min(remaining, yearEvents.length);
              const limited = yearEvents.slice(0, take);

              if (limited.length === 0) continue;

              const cards = limited.map(mapEventToCard);
              sections.push({ year, cards });
              remaining -= cards.length;
            }

            return sections.map(({ year, cards }) => (
              <GridSection
                key={year}
                heading={year !== 'Other' ? year : ''}
                members={cards}
                CardComponent={MediaEventCard}
                items={3}
                className="!p-0"
              />
            ));
          })()}
        </div>
      ) : (
        /* Single Year Tab → One clean grid */
        <GridSection
          heading={activeTab}
          members={eventsForActiveTab.slice(0, visibleCount).map(mapEventToCard)}
          CardComponent={MediaEventCard}
          items={3}
          className="!p-0"
        />
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <GoldButton onClick={() => setVisibleCount(v => v + LOAD_MORE_STEP)}>
            Load More
          </GoldButton>
        </div>
      )}
    </div>
  );
}
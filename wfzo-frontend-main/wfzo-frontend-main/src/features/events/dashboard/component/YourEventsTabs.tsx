'use client';

import { useEffect, useMemo, useState } from 'react';
import { EventData } from './AdvertiseEventModal';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';
import YourEventsCard from './YourEventsCard';

type EventStatus = "draft" | "pending" | "approved" | "published" | "rejected" | "past";

type OnOpenModal = (status: EventStatus, eventId?: string, eventData?: EventData | null) => void;

export type YourEvent = {
  id: string;
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  slug: string;
  eventData?: EventData | null;
  status: EventStatus;
};

type YourEventsTabsProps = {
  events: YourEvent[];
  onOpenModal?: OnOpenModal;
};

const DEFAULT_VISIBLE_COUNT = 9;
const LOAD_MORE_STEP = 9;

export default function YourEventsTabs({ events, onOpenModal }: YourEventsTabsProps) {
  const tabOptions = useMemo(() => [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Past Events', value: 'past' },
  ], []);

  const filteredtabOptions = useMemo(()=>{
    return tabOptions.filter(tab=>
      events.some(event=>event.status===tab.value)
    );
  },[tabOptions,events])

  const [activeTab, setActiveTab] = useState<string>('draft');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(() => {
  if(filteredtabOptions.length > 0 &&
    !filteredtabOptions.some(tab=>tab.value === activeTab)
  ){
    setActiveTab(filteredtabOptions[0].value);
  }
},[filteredtabOptions, activeTab]);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const eventsForActiveTab = useMemo(() => {
    return events.filter(event => event.status === activeTab);
  }, [events, activeTab]);

  const visibleEvents = useMemo(
    () => eventsForActiveTab.slice(0, Math.min(visibleCount, eventsForActiveTab.length)),
    [eventsForActiveTab, visibleCount]
  );

  const hasMore = eventsForActiveTab.length > visibleEvents.length;

  const handleEdit = (event: YourEvent) => {
    if (event.status === 'published' || event.status === 'past') {
      // Redirect to detail page
      window.location.href = `/events/all-events/${event.slug}`;
    } else {
      // Open modal
      onOpenModal?.(event.status, event.id, event.eventData);
    }
  };

  return (
    <div className="py-6 flex flex-col gap-6">
      <ScrollableTabs 
        options={filteredtabOptions} 
        value={activeTab} 
        onValueChange={setActiveTab} 
      />

      {eventsForActiveTab.length === 0 ? (
        <p className="text-wfzo-grey-700 py-10">
          No events in this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleEvents.map((event) => (
            <YourEventsCard
              key={event.id}
              title={event.title}
              organization={event.organization}
              date={event.date}
              time={event.time}
              location={event.location}
              description={event.description}
              imageUrl={event.imageUrl}
              status={event.status}
              onEdit={() => handleEdit(event)}
              
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <GoldButton onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}>
            View More
          </GoldButton>
        </div>
      )}
    </div>
  );
}

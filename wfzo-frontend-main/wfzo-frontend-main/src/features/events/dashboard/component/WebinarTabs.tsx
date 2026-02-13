'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GoldButton from '@/shared/components/GoldButton';
import WebinarCard from './WebinarCard';

type WebinarStatus = "draft" | "pending" | "approved" | "published" | "rejected" | "past";

type OnOpenModal = (status: WebinarStatus, eventId?: string, eventData?: unknown) => void;

export type YourWebinar = {
  id: string;
  title: string;
  organization: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  slug: string;
  eventData?: unknown;
  status: WebinarStatus;
};

type YourWebinarsTabsProps = {
  webinars: YourWebinar[];
  onOpenModal?: OnOpenModal;
};

const DEFAULT_VISIBLE_COUNT = 9;
const LOAD_MORE_STEP = 9;

export default function YourWebinarsTabs({ webinars, onOpenModal }: YourWebinarsTabsProps) {
  const router = useRouter();

  const tabOptions = useMemo(() => [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Past Webinars', value: 'past' },
  ], []);
   const filteredtabOptions=useMemo(()=>{
    return tabOptions.filter(tab=>
      webinars.some(webinar=>webinar.status===tab.value)
    )
  },[tabOptions,webinars])
  

  const [activeTab, setActiveTab] = useState<string>('draft');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  useEffect(()=>{
  if(filteredtabOptions.length>0&&
    !filteredtabOptions.some(tab=>tab.value===activeTab)
  ){
    setActiveTab(filteredtabOptions[0].value);
  }
},[filteredtabOptions, activeTab]);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [activeTab]);

  const webinarsForActiveTab = useMemo(() => {
    return webinars.filter(event => event.status === activeTab);
  }, [webinars, activeTab]);

  const visibleWebinars = useMemo(
    () => webinarsForActiveTab.slice(0, Math.min(visibleCount, webinarsForActiveTab.length)),
    [webinarsForActiveTab, visibleCount]
  );

  const hasMore = webinarsForActiveTab.length > visibleWebinars.length;

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCardClick = (event: YourWebinar) => {
    if (event.status === 'published' || event.status === 'past') {
      // Redirect to detail page
      window.location.href = `/webinars/all-webinars/${event.slug}`;
    } else {
      // Open modal
      onOpenModal?.(event.status, event.id, event.eventData);
    }
  };

  const handleEdit = (event: YourWebinar) => {
    if (event.status === 'published' || event.status === 'past') {
      // Redirect to detail page
      window.location.href = `/webinars/all-webinars/${event.slug}`;
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

      {webinarsForActiveTab.length === 0 ? (
        <p className="text-wfzo-grey-700 py-10">
          No webinars in this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleWebinars.map((event) => (
            <WebinarCard
              key={event.id}
              title={event.title}
              organization={event.organization}
              date={event.date}
              time={event.time}
              location={event.location}
              description={event.description}
              imageUrl={event.imageUrl}
              status={event.status}
              onClick={() => handleCardClick(event)}
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
 
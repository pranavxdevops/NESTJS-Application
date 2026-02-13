'use client';

import { EventTracker } from '@/shared/components/tracking/EventTracker';

interface EventTrackerWrapperProps {
  eventId: string;
  eventTitle: string;
  eventType?: string;
}

export function EventTrackerWrapper({ 
  eventId, 
  eventTitle, 
  eventType 
}: EventTrackerWrapperProps) {
  return (
    <EventTracker 
      eventId={eventId} 
      eventTitle={eventTitle} 
      eventType={eventType} 
    />
  );
}

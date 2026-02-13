'use client';

import { useEffect } from 'react';
import { trackEventView } from '@/lib/analytics/gtag';

export function EventTracker({ 
  eventId, 
  eventTitle,
  eventType 
}: { 
  eventId: string; 
  eventTitle: string;
  eventType?: string;
}) {
  useEffect(() => {
    if (eventId && eventTitle) {
      trackEventView(eventId, eventTitle, eventType);
    }
  }, [eventId, eventTitle, eventType]);

  return null;
}

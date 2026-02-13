import React from "react";
import { EventCard } from "./EventCard";


interface Event {
  id: string;
  title: string;
  date: string;
  organization: string;
  location: string;
  description: string;
  imageUrl?: string;
}

interface PastEventsGridProps {
  events?: Event[];
  onEventClick?: (event: Event) => void;
}

export function PastEventsGrid({ events, onEventClick }: PastEventsGridProps) {
  // Sample events data if none provided
  const defaultEvents: Event[] = [
    {
      id: "1",
      title: "Event Title",
      date: "10-12 Oct, 2025",
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "2",
      title: "Event Title", 
      date: "28 Mar, 2026",
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "3",
      title: "Event Title",
      date: "28 Mar, 2026", 
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "4",
      title: "Event Title",
      date: "10-12 Oct, 2025",
      organization: "Organization", 
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "5",
      title: "Event Title",
      date: "28 Mar, 2026",
      organization: "Organization",
      location: "City, Country", 
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "6",
      title: "Event Title",
      date: "28 Mar, 2026",
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "7",
      title: "Event Title", 
      date: "10-12 Oct, 2025",
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "8",
      title: "Event Title",
      date: "28 Mar, 2026",
      organization: "Organization", 
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    },
    {
      id: "9",
      title: "Event Title",
      date: "28 Mar, 2026",
      organization: "Organization",
      location: "City, Country",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum. Proin id lectus sit amet elit sagittis porttitor."
    }
  ];

  const displayEvents = events || defaultEvents;

  return (
    <div className="w-full px-4 md:px-8 lg:px-30 py-20 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <h1 className="text-2xl md:text-3xl font-heading font-black text-grey-900 mb-6">
          Past Events
        </h1>

        {/* Events Grid */}
        <div className="space-y-6">
          {/* First row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.slice(0, 3).map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={event.date}
                organization={event.organization}
                location={event.location}
                description={event.description}
                imageUrl={event.imageUrl}
                onReadMore={() => onEventClick?.(event)}
              />
            ))}
          </div>

          {/* Second row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.slice(3, 6).map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={event.date}
                organization={event.organization}
                location={event.location}
                description={event.description}
                imageUrl={event.imageUrl}
                onReadMore={() => onEventClick?.(event)}
              />
            ))}
          </div>

          {/* Third row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.slice(6, 9).map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={event.date}
                organization={event.organization}
                location={event.location}
                description={event.description}
                imageUrl={event.imageUrl}
                onReadMore={() => onEventClick?.(event)}
              />
            ))}
          </div>

          {/* Fourth row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.slice(0, 3).map((event) => (
              <EventCard
                key={`repeat_${event.id}`}
                title={event.title}
                date={event.date}
                organization={event.organization}
                location={event.location}
                description={event.description}
                imageUrl={event.imageUrl}
                onReadMore={() => onEventClick?.(event)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

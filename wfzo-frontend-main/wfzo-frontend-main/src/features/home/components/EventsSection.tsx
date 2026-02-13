"use client";

import React, { useRef} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventsCard from "@/shared/components/EventsCard";
import { FALLBACK_IMAGE } from "@/lib/constants/constants";
import { getStrapiMediaUrl } from "@/lib/utils/getMediaUrl";
import GoldButtonChevron from "@/shared/components/GoldButtonChevron";
import { Link } from "i18n/navigation";

interface EventCTA {
  url: string | null;
  title: string | null;
  targetBlank?: boolean;
}
export type Formats = {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
};

interface EventItem {
  id: number;
  title: string | null;
  organizer: string | null;
  summary: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  location: string | null;
  slug?: string | null;
  coverImage?: {
    url: string;
    alt: string;
    formats?: Formats;
  } | null;
  cta?: EventCTA | null;
}

interface EventsSectionProps {
  title: string;
  selectedEvents: EventItem[];
  cta?: EventCTA | null;
}

// Helper to format event dates like "10–12 Oct 2025"
function formatEventDate(start: string | null, end: string | null) {
  if (!start) return "";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const dayStart = startDate.getDate(); // 10
  const dayEnd = endDate ? endDate.getDate() : null; // 12
  const month = startDate.toLocaleString("en-US", { month: "short" }); // "Oct"
  const year = startDate.getFullYear();

  const dayPart = dayEnd ? `${dayStart}-${dayEnd}` : `${dayStart}`;

  return `${dayPart} ${month}, ${year}`; // ✅ "10-12 Oct, 2025"
}



export default function EventsSection({ title, selectedEvents, cta }: EventsSectionProps) {
   const goPrev = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 0;
    container.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const goNext = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 0;
    container.scrollBy({ left: cardWidth, behavior: "smooth" });
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Remove time

  const upcomingEvents = selectedEvents.filter((event) => {
  const rawDate = event.endDateTime || event.startDateTime;
  if (!rawDate) return false;

  const eventDate = new Date(rawDate);
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  return eventDay >= today;
  });
  if (!upcomingEvents || upcomingEvents.length === 0) return null;
  return (
    <section className="py-10 md:py-20  bg-[#FCFAF8]">
      <div className="mx-auto px-5 md:px-30">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          {cta?.url && cta?.title && (
          <Link href={cta.url || '/' as any} target={cta?.targetBlank ? '_blank' : '_self'}>
            <h2 className="text-2xl md:text-3xl font-montserrat font-black text-wfzo-grey-900">
              {title}
            </h2>
          </Link>
          )}
          
          {cta?.url && cta?.title && (
            <Link
              href={cta.url || '/' as any}
              target={cta.targetBlank ? "_blank" : "_self"}
              className="text-[#8F713F] font-source font-bold hover:text-wfzo-gold-600"
            >
              {cta.title}
            </Link>
          )}
        </div>

        {/* Desktop Event Cards */}
        
        <div className="hidden md:flex gap-8">
          {upcomingEvents.slice(0, 2).map((item, index) => (
            <EventsCard
              key={item.id}
              title={item.title || ""}
              organization={item.organizer || ""}
              location={item.location || ""}
              description={item.summary || ""}
              date={formatEventDate(item.startDateTime, item.endDateTime)}
              // image={item.coverImage?.url || ""}
              extraClass={
                upcomingEvents.length === 1
                  ? "basis-full"
                  : index === 0
                  ? "basis-[67%]"
                  : "basis-[33%]"
              }
              singleItem={upcomingEvents.length === 1}
              image={
                  item.coverImage?.formats?.large
                    ? getStrapiMediaUrl(item.coverImage.formats.large)
                    : item.coverImage?.url
                      ? getStrapiMediaUrl(item.coverImage.url)
                      : FALLBACK_IMAGE
                }  
              isMobile={false}
              variant={index === 0 ? "horizontal" : "vertical"}
              cta={item.cta}
              cardUrl={item.slug ? `/events/upcoming-events/${item.slug}` : undefined}
              nav={false}
              
            />
          ))}
        </div>

        {/* Mobile Event Card */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 space-y-4 md:hidden px-2 snap-x snap-mandatory scrollbar-hidden scroll-smooth"
        >
          {upcomingEvents.map((item) => (
            <div key={item.id} className={`snap-start shrink-0 ${upcomingEvents.length === 1 ? "w-full": "w-[85%]" } min-h-[420px]`}>
              <EventsCard
                title={item.title || ""}
                organization={item.organizer || ""}
                location={item.location || ""}
                description={item.summary || ""}
                date={formatEventDate(item.startDateTime, item.endDateTime)}
                image={
                  item.coverImage?.formats?.large
                    ? getStrapiMediaUrl(item.coverImage.formats.large)
                    : item.coverImage?.url
                      ? getStrapiMediaUrl(item.coverImage.url)
                      : FALLBACK_IMAGE
                }           
                isMobile
                cta={item.cta}
                singleItem={upcomingEvents.length === 1}
                cardUrl={item.slug ? `/events/upcoming-events/${item.slug}` : undefined}
                nav={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Mobile Only */}
        {upcomingEvents.length > 1 && (
          <div className="flex justify-start gap-6 md:hidden mt-4">
            
            <div className="flex items-center gap-6">
                <GoldButtonChevron onClick={goPrev}>
                  <ChevronLeft className="w-6 h-6 text-white" />
                </GoldButtonChevron>
            
                <GoldButtonChevron onClick={goNext}>
                  <ChevronRight className="w-6 h-6 text-white" />
                </GoldButtonChevron>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';
import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import LightButton from '@/shared/components/LightButton';
import { FALLBACK_BG_IMAGE } from '@/lib/constants/constants';
import { Link } from 'i18n/navigation';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface HeroSectionProps {
  id: number;
  autoPlay: boolean;
  loop: boolean;
  autoPlayMs: number;
  overlayEvent?: {
    id: number;
    title: string;
    summary: string;
    startDateTime: string;
    endDateTime: string;
    registrationUrl?: string;
    cta?: {
      id: number;
      title: string;
      targetBlank: boolean;
      variant: string;
      type: string;
      url: string | null;
    };
  };
  slides?: Array<{
    id: number;
    headline: string;
    subhead: string;
    image?: { url?: string; alt?: string };
    cta?: { title: string; url?: string | null; targetBlank?: boolean };
  }>;
}

interface EventCountdownCardProps {
  countdown: CountdownState;
  event: {
    title: string;
    summary?: string;
    cta?: { title: string; url?: string | null };
  };
}

export default function HeroSection({
  autoPlay,
  loop,
  autoPlayMs,
  overlayEvent,
  slides: slidesFromProps,
}: HeroSectionProps) {
  const isOverlayValid = overlayEvent ? isOverlayEventUpcomingOrOngoing(overlayEvent) : false;
  const [countdown, setCountdown] = useState<CountdownState | null>(
    overlayEvent && isOverlayValid ? calculateCountdown(overlayEvent.startDateTime) : null
  );

  function isOverlayEventUpcomingOrOngoing(event: { startDateTime: string; endDateTime: string }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const end = event.endDateTime ? new Date(event.endDateTime) : new Date(event.startDateTime);
  const eventDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return eventDate >= today;
}

  // Countdown timer
  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (!prev) return null;
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Ensure slides exist and fallback
  const slides = (slidesFromProps || []).slice(0, 5).map((slide) => ({
    ...slide,
    image: {
      url: slide.image?.url ? getStrapiMediaUrl(slide.image.url, FALLBACK_BG_IMAGE) : FALLBACK_BG_IMAGE,
      alt: slide.image?.alt || 'Hero slide image',
    },
  }));

  // Embla carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onInit = useCallback((api: any) => {
    setScrollSnaps(api.scrollSnapList());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  const onSelect = useCallback((api: any) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      const nextIndex = (selectedIndex + 1) % scrollSnaps.length;
      setSelectedIndex(nextIndex);
      scrollTo(nextIndex);
    }, autoPlayMs * 1000);
    return () => clearInterval(interval);
  }, [scrollSnaps.length, scrollTo, selectedIndex, autoPlay, autoPlayMs]);

  return (
    <section className="relative lg:h-[100vh] h-screen w-full overflow-hidden">
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="relative h-screen min-w-[100%]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${slide.image.url}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-transparent" />
              <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-4 md:px-8 lg:px-[110px] text-center w-full">
                <h1 className="font-montserrat font-black text-white text-[32px] sm:text-[36px] md:text-[48px] lg:text-[60px] leading-[40px] md:leading-[58px] lg:leading-[80px] mb-4 text-center max-w-full mx-auto">
                  {slide.headline}
                </h1>
                <p className="text-[20px] font-semibold sm:text-sm md:text-base text-white font-source mb-4 md:mb-6 px-2 sm:px-4 sm:break-words max-w-xs sm:max-w-md md:max-w-2xl mx-auto">
                  {slide.subhead}
                </p>
                {slide.cta && (
                  <Link
                    href={slide.cta.url || '/' as any}
                    target={slide.cta?.targetBlank ? "_blank" : ""}
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {' '}
                    <button className="glass-effect px-8 md:px-6 md:py-2 sm:px-8 py-3 rounded-xl text-white font-source font-semibold hover:bg-white/10 transition-all cursor-pointer">
                      {slide.cta.title}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown */}
      {countdown && overlayEvent && isOverlayValid && (
        <div className="absolute inset-x-5 bottom-15 md:bottom-25 z-30">
          <div className="w-full flex flex-col justify-center">
            <div className="hidden lg:block">
              <EventCountdownCard countdown={countdown} event={overlayEvent} />
            </div>
            <div className="-mt-32 lg:hidden w-full">
              <MobileEventCountdownCard countdown={countdown} event={overlayEvent} />
            </div>
          </div>
        </div>
      )}

      {/* Carousel Dots */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-6 md:bottom-10 z-30">
        <div className="glass-effect flex items-center gap-4 md:gap-3 rounded-full px-2 py-2">
          {scrollSnaps.map((_, idx) => {
            const isActive = idx === selectedIndex;
            const isFirstOrLast = idx === 0 || idx === scrollSnaps.length - 1;
            let dotClass = '';
            const outlineClass = isActive ? 'border-2 border-white' : 'border border-white/40';
            if (isActive) dotClass = 'w-6 h-2 rounded-full';
            else if (isFirstOrLast) dotClass = 'w-1 h-1 rounded-full';
            else dotClass = 'w-2 h-2 rounded-full';
            return (
              <motion.button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`transition-all duration-200 bg-white ${outlineClass} ${dotClass}`}
                aria-label={`Go to slide ${idx + 1}`}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------- Countdown helpers ----------------
function calculateCountdown(targetDate: string): CountdownState {
  const diff = Math.max(new Date(targetDate).getTime() - new Date().getTime(), 0) / 1000;
  return {
    days: Math.floor(diff / (3600 * 24)),
    hours: Math.floor((diff % (3600 * 24)) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: Math.floor(diff % 60),
  };
}

function EventCountdownCard({ countdown, event }: EventCountdownCardProps) {
  const isOngoing =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0;
  return (
    <div className="glass-effect rounded-2xl px-4 py-4.5 w-full max-w-[800px] flex flex-row items-center justify-between gap-6 mx-auto">
      <div className="flex-1">
        <p className="text-white text-xs mb-1 text-left self-start font-source">
          {isOngoing ? 'Ongoing event:' : 'Upcoming event:'}
        </p>
        <h3 className="text-white text-sm sm:text-base font-source font-bold leading-5 truncate max-w-[410px]">
          {event.title}
        </h3>
      </div>
      <div className="flex items-center gap-4">
        <CountdownRow countdown={countdown} />
        {!isOngoing && event.cta && (
          <a
            href={event.cta.url || '/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <LightButton>{event.cta.title}</LightButton>
          </a>
        )}
      </div>
    </div>
  );
}

function MobileEventCountdownCard({ countdown, event }: EventCountdownCardProps) {
  const isOngoing =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0;
  return (
    <div className="glass-effect rounded-2xl p-4 w-full flex flex-col space-y-2 mx-auto max-w-[353px]">
      <div>
        <p className="text-white text-xs mb-1 font-source text-left sm:text-center">
          {isOngoing ? 'Ongoing event:' : 'Upcoming event:'}
        </p>
        <h3 className="text-white text-sm sm:text-base font-source font-bold leading-5 truncate text-left sm:text-center">
          {event.title}
        </h3>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-center">
        <CountdownRow countdown={countdown} />
        {!isOngoing && event.cta && (
          <a
            href={event.cta.url || '/'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <LightButton>{event.cta.title}</LightButton>
          </a>
        )}
      </div>
    </div>
  );
}

function CountdownRow({ countdown }: { countdown: CountdownState }) {
  return (
    <div className="flex items-center gap-1">
      <CountdownUnit value={countdown.days.toString().padStart(2, '0')} label="days" />
      <Colon />
      <CountdownUnit value={countdown.hours.toString().padStart(2, '0')} label="hours" />
      <Colon />
      <CountdownUnit value={countdown.minutes.toString().padStart(2, '0')} label="mins" />
      <Colon />
      <CountdownUnit value={countdown.seconds.toString().padStart(2, '0')} label="sec" />
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-md px-1 py-1 min-w-[40px] text-center">
      <div className="text-[#7C6237] font-source font-bold text-base">{value}</div>
      <div className="text-[#7C6237] font-source text-xs">{label}</div>
    </div>
  );
}

function Colon() {
  return (
    <div className="flex flex-col justify-center items-center gap-0.5 w-0.5">
      <div className="w-1 h-1 bg-white rounded-full" />
      <div className="w-1 h-1 bg-white rounded-full" />
    </div>
  );
}

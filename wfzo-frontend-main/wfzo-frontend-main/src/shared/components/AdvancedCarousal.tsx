'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';

import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

import ContentHeader from '@/shared/components/ContentHeader';

import GoldButtonChevron from './GoldButtonChevron';

interface CarouselProps {
  children: React.ReactNode;
  itemsCount: number;
  title?: string;
  description?: string | React.ReactNode;
  headerCta?: {
    href: string;
    title: string;
    targetBlank?: boolean;
    variant?: 'PRIMARY' | 'LINK';
    type?: 'internal' | 'external';
  };
  pageHeading?: boolean;
  showExploreAll?: boolean;
  exploreAllHref?: string;
  visibleSlides?: {
    xs?: number;  // Mobile (< 640px)
    sm?: number;  // Small tablets (640px - 768px)
    md?: number;  // Tablets (768px - 1024px)
    lg?: number;  // Desktop (1024px - 1280px)
    xl?: number;  // Large desktop (> 1280px)
  };

  // Scroll behavior
  slidesToScroll?: number;

  // Carousel options
  loop?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  align?: "start" | "center" | "end";

  // Styling
  showControls?: boolean;
  showProgressBar?: boolean;
  containerClassName?: string;
  slideClassName?: string;
  controlsPosition?: "start" | "center" | "end";

  // Spacing
  gap?: number; // Gap between slides in pixels
}

export default function AdvancedCarousel({
  children,
  itemsCount,
  title,
  description,
  headerCta,
  pageHeading = false,
  showExploreAll = false,
  exploreAllHref = '/',
  visibleSlides = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  slidesToScroll = 1,
  loop = true,
  autoplay = false,
  autoplayDelay = 3000,
  align = "start",
  showControls = true,
  showProgressBar = true,
  containerClassName = 'px-5 md:px-30 py-10 md:py-20',
  slideClassName = '',
  controlsPosition = 'start',
  gap = 16,
}: CarouselProps) {
  const [currentVisibleSlides, setCurrentVisibleSlides] = useState(
    visibleSlides.lg || 4
  );

  // Use ref to maintain stable autoplay plugin instance
  const autoplayPluginRef = useRef(
    autoplay
      ? Autoplay({
          delay: autoplayDelay,
          stopOnInteraction: false, // Changed to false so manual navigation doesn't stop autoplay
          stopOnMouseEnter: true,
        })
      : null
  );

  // Responsive breakpoint logic
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCurrentVisibleSlides(visibleSlides.xs || 1);
      } else if (width < 768) {
        setCurrentVisibleSlides(visibleSlides.sm || 2);
      } else if (width < 1024) {
        setCurrentVisibleSlides(visibleSlides.md || 3);
      } else if (width < 1280) {
        setCurrentVisibleSlides(visibleSlides.lg || 4);
      } else {
        setCurrentVisibleSlides(visibleSlides.xl || 4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visibleSlides]);

  // Embla options
  const options: EmblaOptionsType = {
    loop,
    align,
    skipSnaps: false,
    containScroll: "trimSnaps",
    slidesToScroll,
  };

  // Create plugins array with stable reference
  const plugins = autoplayPluginRef.current ? [autoplayPluginRef.current] : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);
  const [selected, setSelected] = useState(0);
  const [total, setTotal] = useState(0);

  const onSelect = useCallback(
    (api: any) => setSelected(api.selectedScrollSnap()),
    []
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onReInit = () => {
      setSelected(emblaApi.selectedScrollSnap());
      setTotal(emblaApi.scrollSnapList().length);
    };

    setSelected(emblaApi.selectedScrollSnap());
    setTotal(emblaApi.scrollSnapList().length);

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onReInit);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onReInit);
    };
  }, [emblaApi, onSelect]);

  // Scroll with autoplay reset
  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    
    // Reset autoplay timer to 0
    if (autoplayPluginRef.current) {
      autoplayPluginRef.current.reset();
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    
    // Reset autoplay timer to 0
    if (autoplayPluginRef.current) {
      autoplayPluginRef.current.reset();
    }
  }, [emblaApi]);

  const shouldShowControls = showControls && itemsCount > currentVisibleSlides;

  const controlsJustify =
    controlsPosition === 'center'
      ? 'justify-center'
      : controlsPosition === 'end'
        ? 'justify-end'
        : 'justify-start';

  return (
    <section className={`${containerClassName}`}>
      {title && (
        <ContentHeader
          pageHeading={pageHeading}
          header={title}
          description={description || ''}
          showExploreAll={showExploreAll}
          exploreAllHref={exploreAllHref}
        />
      )}

      <div className={`overflow-hidden relative -left-4`} ref={emblaRef}>
        <div className="flex" style={{ marginLeft: ``, marginRight: `` }}>
          {React.Children.map(children, (child) => (
            <div
              className={`flex-none ${slideClassName}`}
              style={{
                flex: `0 0 ${100 / currentVisibleSlides}%`,

                paddingLeft: `${gap}px`,

                paddingRight: `${gap}px`,

                paddingTop: `${gap / 2}px`,

                paddingBottom: `${gap / 2}px`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {shouldShowControls && (
        <div className={`flex flex-col gap-6 items-start ${controlsJustify}`}>
          {showProgressBar && (
            <div className="w-full h-2 bg-wfzo-gold-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-wfzo-gold-600 rounded-full transition-all duration-300 ease-linear"
                style={{
                  width: `${100 / total}%`,

                  transform: `translateX(${selected * 100}%)`,
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-8">
            <GoldButtonChevron onClick={scrollPrev}>
              <ChevronLeft className="w-6 h-6 text-white" />
            </GoldButtonChevron>

            <GoldButtonChevron onClick={scrollNext}>
              <ChevronRight className="w-6 h-6 text-white" />
            </GoldButtonChevron>
          </div>
        </div>
      )}
    </section>
  );
}
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import GoldButtonChevron from '@/shared/components/GoldButtonChevron';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

interface GridSectionProps<T extends object> {
  heading: string;
  members: T[];
  CardComponent: React.ComponentType<any>;
  items?: number;
  className?: string;
  showHeading?: boolean;
  // Control mobile behavior: default 'carousel' keeps existing UX
  mobileMode?: 'carousel' | 'list';
}

export default function GridSection<T extends object>({
  heading,
  showHeading = true,
  members,
  CardComponent,
  items = 3,
  className = "",
  mobileMode = 'carousel',
}: GridSectionProps<T>) {
  // Enable autoplay with 8s delay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      containScroll: 'keepSnaps',
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 8000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(
    (api: { selectedScrollSnap: () => number }) => setSelected(api.selectedScrollSnap()),
    []
  );

  useEffect(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', () => setSelected(emblaApi.selectedScrollSnap()));
    return () => {
      emblaApi.off && emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // Utility: get best possible image URL from Strapi
  const getImageUrl = (image: any): string => {
    return image?.formats?.large
      ? getStrapiMediaUrl(image.formats.large)
      : image?.url
        ? getStrapiMediaUrl(image.url)
        : FALLBACK_IMAGE;
  };

  return (
    <div className={`flex flex-col gap-6 px-5 md:px-30 py-10 md:py-20 ${className}`}>
      {/* Heading */}
      { showHeading && 
      <div className="flex items-end gap-3">
        <h2 className="flex-1 text-neutral-900 font-montserrat lg:text-3xl md:text-2xl text-2xl font-black leading-10">
          {heading}
        </h2>
      </div>
      }

      {/* Desktop Grid */}
      <div className={`hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${items} gap-6`}>
        {members.map((member: any, index) => (
          <div  onClick={() => member?.onImageClick?.()} key={index}>
          <CardComponent
            key={index}
            {...(member as T)}
            imageUrl={getImageUrl(member.imageUrl)} // ✅ Fixed: provides correct prop
          />
          </div>
        ))}
      </div>

      {/* Mobile: carousel or list */}
      {mobileMode === 'carousel' ? (
        <div className="md:hidden relative">
          <div className="overflow-hidden py-1" ref={emblaRef}>
            <div className="flex gap-4">
              {members.map((member: any, index) => (
                <div onClick={() => member?.onImageClick?.()} key={index} className="flex-none w-[80%] first:ml-4">
                  <CardComponent
                    {...(member as T)}
                    imageUrl={getImageUrl(member.imageUrl)} // ✅ Fixed here too
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-2 bg-wfzo-gold-200 rounded-full overflow-hidden flex">
              {members.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full transition-all duration-300 ${
                    idx === selected ? 'bg-wfzo-gold-600 rounded-full' : 'bg-wfzo-gold-200'
                  }`}
                  style={{ width: `${100 / members.length}%` }}
                />
              ))}
            </div>
          </div>

          {/* Chevrons below the progress bar */}
          <div className="flex items-center gap-6 mt-6">
            <GoldButtonChevron onClick={scrollPrev}>
              <ChevronLeft className="w-6 h-6 text-white" />
            </GoldButtonChevron>

            <GoldButtonChevron onClick={scrollNext}>
              <ChevronRight className="w-6 h-6 text-white" />
            </GoldButtonChevron>
          </div>
        </div>
      ) : (
        <div className="md:hidden flex flex-col gap-10">
          {members.map((member: any, index) => (
            <div key={index} className="w-full">
              <CardComponent
                {...(member as T)}
                imageUrl={getImageUrl(member.image)} // ✅ list mode fix
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

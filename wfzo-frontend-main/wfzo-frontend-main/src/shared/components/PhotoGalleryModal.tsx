'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: PhotoGalleryModalProps) {
  const options: EmblaOptionsType = {
    loop: true,
    align: 'center',
    skipSnaps: false,
    startIndex: initialIndex,
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selected, setSelected] = useState(initialIndex);
  const [total, setTotal] = useState(images.length);

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

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onReInit);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onReInit);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl w-full max-w-[1200px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center p-4 bg-white rounded-t-xl">
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#333333] hover:text-black transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-2 pb-2">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex-none w-full flex items-center justify-center"
                  style={{ minWidth: '100%' }}
                >
                  <img
                    src={image}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-auto max-h-[700px] object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-2 pb-4">
          <div className="h-2 bg-wfzo-gold-200 rounded overflow-hidden flex">
            {images.map((_, index) => (
              <div
                key={index}
                className={`flex-1 transition-colors duration-300 ${
                  index === selected
                    ? 'bg-wfzo-gold-600 rounded'
                    : 'bg-wfzo-gold-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-10">
            <button
              onClick={scrollPrev}
              className="flex flex-col items-start gap-2 p-0.5 rounded-xl bg-wfzo-gold-700 hover:bg-wfzo-gold-800 transition-colors"
              aria-label="Previous image"
            >
              <div className="flex items-center justify-center p-[7px] rounded-[11px] border-t border-r border-l border-wfzo-gold-500 bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500">
                <ChevronLeft className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              onClick={scrollNext}
              className="flex flex-col items-start gap-2 p-0.5 rounded-xl bg-wfzo-gold-700 hover:bg-wfzo-gold-800 transition-colors"
              aria-label="Next image"
            >
              <div className="flex items-center justify-center p-[7px] rounded-[11px] border-t border-r border-l border-wfzo-gold-500 bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

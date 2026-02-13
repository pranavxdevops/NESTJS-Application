'use client';
import React, { useEffect, useRef, useState } from 'react';
import MembershipSection from './MembershipSection';
import { FALLBACK_VIDEO, FALLBACK_VIDEO_BG, FALLBACK_VIDEO_MOBILE } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import LightButton from '@/shared/components/LightButton';


interface VideoItem {
  url: string;
  caption?: string;
}

interface CTA {
  title: string;
  url: string;
  targetBlank?: boolean;
}

interface VideoContainerSectionProps {
  id?: number;
  title?: string;
  shortDescription?: string;
  backgroundImage?: { url?: string } | null;
  video?: VideoItem;
  videoAutoplay?: boolean;
  cta?: CTA;
  hideMembership?: boolean;
  membershipSection?: {
    title?: string;
    description?: string;
    backgroundImage?: { url?: string } | null;
    cta?: CTA;
    removeAbsolute?: boolean;
    className?: string;
  };
}

export default function VideoContainerSection({
  title = 'How We Empower Free Zones Worldwide',
  shortDescription = 'Across every domain of the free zone landscape...',
  backgroundImage,
  video,
  videoAutoplay = true,
  cta,
  hideMembership = false,
  membershipSection,
}: VideoContainerSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const promoVideoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  // 🌟 Parallax state
  const [offsetY, setOffsetY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY * 0.75); // slower scroll
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bgImage = getStrapiMediaUrl(backgroundImage?.url, FALLBACK_VIDEO_BG);

  // Decide which fallback to use (desktop vs mobile) BEFORE merging with Strapi url
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const mobileUA = /iphone|ipad|ipod|android|ios|mobile/.test(ua);
    const narrowViewport = window.matchMedia('(max-width: 820px)').matches;
    setIsMobile(mobileUA || narrowViewport);
  }, []);

  const chosenFallback = isMobile ? FALLBACK_VIDEO_MOBILE : FALLBACK_VIDEO;
  // If coming from Strapi, we still prefer direct remote (assuming it supports range). For local fallback assets, route through streaming API for explicit Range support.
  const rawUrl = video?.url ? getStrapiMediaUrl(video.url, chosenFallback) : chosenFallback;

  const openModal = () => {
    setIsOpen(true);
    promoVideoRef.current?.pause();
  };

  const closeModal = () => {
    setIsOpen(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
      modalVideoRef.current.currentTime = 0;
    }
    if (promoVideoRef.current) {
      promoVideoRef.current.currentTime = 0;
      promoVideoRef.current.play();
    }
  };

  // Increase bottom padding when membership card is floating so CTA doesn't overlap
  const howWeEmpowerPadding = hideMembership ? 'py-16' : 'pt-20 pb-[165px] min-h-screen lg:pt-20 lg:pb-[200px]';

  return (
    <>
      <section className={`relative ${howWeEmpowerPadding}`}>
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundPositionY: `${offsetY}px`,
          }}
        />
        <div className="absolute inset-0 gradient-overlay-180 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative z-10 container mx-auto flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-16 px-5">
            <h2 className="text-4xl md:text-6xl font-montserrat font-black text-white mb-6 leading-tight">
              {title}
            </h2>
            <p className="text-white font-source text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {shortDescription}
            </p>
          </div>

          {/* Video Preview */}
          <div className="relative mb-16 w-full lg:max-w-[1200px]">
            <div className="sm:rounded-2xl border-0 sm:border-[10px] sm:border-wfzo-gold-600/60 overflow-hidden">
              <div className="relative">
                <video
                  ref={promoVideoRef}
                  className="w-full h-[300px] md:h-[450px] lg:h-[675px] object-cover lg:max-w-[1200px]"
                  src={rawUrl}
                  muted
                  playsInline
                  autoPlay={videoAutoplay}
                  loop={false}
                  onTimeUpdate={(e) => {
                    const vid = e.currentTarget;
                    if (vid.currentTime >= 20) {
                      vid.currentTime = 0;
                      vid.play();
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <button
                  onClick={openModal}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-15 h-15 md:w-20 md:h-20 text-white"
                    >
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
                      <path d="M10 8v8l6-4z" fill="white" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          {cta && cta.title && (
            <a
              href={cta.url ?? "/profile"}
              target={cta.targetBlank ? '_blank' : '_self'}
              rel={cta.targetBlank ? 'noopener noreferrer' : undefined}
              className="mb-25 md:mb-12 inline-block relative z-20"
            >
              <LightButton style={{padding: '7px 23px'}}>
                {cta.title || 'Learn More'}
              </LightButton>
            </a>
          )}
        </div>

        {/* Floating Membership Card */}
        {!hideMembership && (
          <MembershipSection
            {...membershipSection}
          />
        )}
      </section>

      {/* Video Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-4xl rounded-xl overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-20 bg-white/10 px-3 py-2 rounded-md text-white"
            >
              Close
            </button>
            <video
              ref={modalVideoRef}
              className="w-full h-auto max-h-[80vh] bg-black"
              preload='metadata'
              src={rawUrl}
              controls
              autoPlay
              loop={true}
            />
          </div>
        </div>
      )}
    </>
  );
}

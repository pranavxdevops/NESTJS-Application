'use client';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import EcosystemCard from '@/shared/components/EcosystemCard';
import React, { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import Image from "next/image";

type Formats = {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
};
interface Card {
  id: number;
  title: string;
  description: string;
  image?: {
    url?: string;
    alt?: string;
    formats?: Formats;
  };
}

interface EcosystemSectionProps {
  id?: number;
  title?: string;
  description?: string;
  backgroundImage?: { url?: string } | null;
  cards: Card[];
  hideMembership?: boolean;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.95,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

export default function EcoSection({
  title = 'WFZO Ecosystem',
  description = 'Across every domain of the free zone landscape...',
  backgroundImage,
  cards,
  hideMembership = false,
}: EcosystemSectionProps) {
  const ecosystemPadding = hideMembership ? 'pt-16 pb-16' : 'pt-36 pb-20';

  // 🌟 Parallax state
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setOffsetY(rect.top*0.5);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initialize
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bgImage = backgroundImage?.url
    ? getStrapiMediaUrl(backgroundImage.url, FALLBACK_IMAGE)
    : FALLBACK_IMAGE; // fallback background

  return (
    <section ref={ref}  className={`relative overflow-hidden ${ecosystemPadding}`}>
      <div className="absolute left-0 top-[-25%] w-full h-[140%]">
        <Image
          src={bgImage}
          alt="Parallax background"
          fill
          style={{
            objectFit: 'cover',
            objectPosition: `center ${-offsetY}px`,
          }}
          
        />
      </div>
      <div className="absolute inset-0 gradient-overlay" />

      <div className="relative z-10 container mx-auto px-5 lg:px-[120px]">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-montserrat font-black text-white mb-6 pt-[80px]">
            {title}
          </h2>
          <p className="text-white font-source text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Ecosystem Cards */}
        <div className="hidden lg:flex gap-8 justify-center">
          {cards.map((item, i) => {
            const imageUrl = item.image?.formats?.large
            ? getStrapiMediaUrl(item.image.formats.large)
            : item.image?.url
              ? getStrapiMediaUrl(item.image.url)
              : FALLBACK_IMAGE;
            return (
              <motion.div
                key={item.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                className="w-[384px] shrink-0"
              >
                <EcosystemCard key={item.id} {...item} image={imageUrl} />
              </motion.div>
            );
          })}
        </div>

        <div className="lg:hidden space-y-8">
          {cards.map((item, i) => {
            const imageUrl = item.image?.formats?.large
            ? getStrapiMediaUrl(item.image.formats.large)
            : item.image?.url
              ? getStrapiMediaUrl(item.image.url)
              : FALLBACK_IMAGE;
            return (
              <motion.div
                key={item.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
              >
                <EcosystemCard key={item.id} {...item} image={imageUrl} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

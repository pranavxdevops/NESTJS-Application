import { getAppPublicImages, getStrapiMediaUrl } from '@/lib/utils/getMediaUrl'
import React from 'react'

type HeroProps = {
  imageUrl?: string; // relative to public/ by default
};

const Hero: React.FC<HeroProps> = ({ imageUrl}) => {
  const defaultImage = 'about-hero.jpg';
  const backgroundImageUrl = !imageUrl ? getAppPublicImages(defaultImage) : getStrapiMediaUrl(imageUrl)
  return (
    <div
      className="relative flex h-[220px] md:h-[500px] w-full items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    />
  );
}

export default Hero

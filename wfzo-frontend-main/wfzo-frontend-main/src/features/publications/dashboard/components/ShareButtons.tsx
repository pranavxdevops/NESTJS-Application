'use client';

import { useEffect, useState } from 'react';

type Platform = 'Twitter' | 'Facebook' | 'LinkedIn' | 'WhatsApp';

type IconMap = Record<Platform, string>;

interface ShareButtonsProps {
  iconMap: IconMap;
}

export default function ShareButtons({ iconMap }: ShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  if (!currentUrl) return null;

  return (
    <div className="flex justify-start gap-[12px]">
      {Object.entries(iconMap).map(([platform, iconSrc]) => (
        <a
          key={platform}
          href={
            platform === 'Twitter'
              ? `https://twitter.com/share?url=${encodeURIComponent(currentUrl)}`
              : platform === 'Facebook'
              ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
              : platform === 'LinkedIn'
              ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
              : platform === 'WhatsApp'
              ? `https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`
              : '#'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={iconSrc} alt={platform} />
        </a>
      ))}
    </div>
  );
}

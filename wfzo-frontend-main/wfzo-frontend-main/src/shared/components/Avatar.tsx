import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className,
  fallbackText,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const getFallbackInitials = () => {
    if (fallbackText) {
      const names = fallbackText.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return fallbackText.substring(0, 2).toUpperCase();
    }
    return alt.substring(0, 2).toUpperCase();
  };

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden bg-gray-200', sizes[size], className)}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-wfzo-gold-400 to-wfzo-gold-600 text-white font-semibold',
        sizes[size],
        className
      )}
    >
      {getFallbackInitials()}
    </div>
  );
};

export default Avatar;

"use client"
import React from 'react';
import { Mail } from 'lucide-react';
import Flag from 'react-world-flags';
import Image from 'next/image';
import { ImageType } from '@/shared/types/globals';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { useRouter,usePathname } from 'next/navigation';


interface ContactCardProps {
  country: string;
  flag?: string;
  company: string;
  email: string;
  phone: string;
  showImage?: boolean;
  image?: ImageType;
  cardUrl?: string;
  fullPath?: string
}

const ContactCard: React.FC<ContactCardProps> = ({
  country,
  flag = 'AE',
  company,
  email,
  phone,
  showImage = true,
  image,
  cardUrl,
  fullPath
}) => {
  const pathname = usePathname();
   const router = useRouter();
    const handleCardClick = () => {
  const navigateTo = fullPath || cardUrl;
 
  if (!navigateTo) return;
 
  if (navigateTo.startsWith('/')) {
    router.push(navigateTo);
  } else {
    window.open(navigateTo, '_blank', 'noopener,noreferrer');
  }
};
   const imageUrl =
   image?.formats?.medium
    ? getStrapiMediaUrl(image.formats.medium)
    : image?.url
    ? getStrapiMediaUrl(image.url)
    : FALLBACK_IMAGE;
  return (
    <div
      className="group rounded-2xl shadow-wfzo gap-6 mb-6 transform transition-all duration-500 ease-in-out aspect-[4/5.15] p-4 overflow-hidden cursor-pointer hover:scale-[1.02]"
      onClick={handleCardClick}
      
    >
      <div className="flex flex-col h-full relative">
        {/* Image */}
        {showImage && (
          <div className="relative w-full aspect-[4/4] rounded-2xl overflow-hidden">
            {image ? (
              <Image
                src={imageUrl}
                alt={company || 'Office image'}
                fill
                className="object-contain object-middle h-[250px] transition-transform duration-500 ease-in-out group-hover:scale-105"
                sizes="100%"
                priority={false}
              />
            ) : (
              <div className="flex gap-2 h-full w-full items-center justify-center bg-neutral-grey-200">
                <div className="w-12 h-12 bg-neutral-grey-400 rounded flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-grey-400"></div>
                </div>
                <div className="w-12 h-12 bg-neutral-grey-400 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[10px] border-b-neutral-grey-400 border-r-[6px] border-r-transparent"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-5 p-2 flex-1 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flag code={flag} style={{ width: 21, height: 15, borderRadius: 4 }} />
              <span className="text-xs text-gray-500 font-source">{country}</span>
            </div>
            <h3  className="text-base font-bold text-neutral-grey-900 font-source-sans leading-5 line-clamp-2 h-[40px]">
              {company}
            </h3>
            <a href={`mailto:${email}`}>
              <div className="flex items-center gap-1 mt-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-source">{email}</span>
              </div>
            </a>
            {/**<a href={`tel:${phone}`}>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-source pt-2">{phone}</span>
              </div>
            </a>*/}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;

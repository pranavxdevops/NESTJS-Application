import { parseRichText } from '@/lib/utils/renderRichText';
import Image from 'next/image';
import Link from 'next/link';
import GoldButton from './GoldButton';
import LightButton from './LightButton';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

interface ContentSectionProps {
  title?: string;
  content: string;
  imageUrl: string | null;
  imagePosition: 'left' | 'right';
  imageHeight?: 'normal' | 'tall';
  className?: string;
  alignment: string;
  backgroundImage?: string;
  cta?: { title: string; url?: string; targetBlank?: boolean; variant?: string; id?: string; type?:string };
  variant?: 'gold' | 'light';
  innerClass?: string;
}

export default function ContentSection({
  title,
  content,
  imageUrl,
  imagePosition,
  imageHeight = 'normal',
  className = '',
  alignment,
  backgroundImage,
  cta,
  variant = 'gold',
  innerClass = '',
}: ContentSectionProps) {
  const isImageLeft = imagePosition === 'left';
  // Apply a responsive max-height so the image never grows too tall while still avoiding any cropping
  // Full image size: no max-height limit (prevents any perceived clipping)
  
  // alignment handling
  const alignItems =
    alignment === 'top'
      ? 'md:items-start'
      : alignment === 'bottom'
        ? 'md:items-end'
        : 'md:items-start';
        // In ContentSection.tsx – temporarily add this
  return (
    <div className={`w-full max-w-full mx-auto py-10 md:py-20 ${className}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div
        className={`flex flex-col gap-6 md:flex-row md:gap-16 px-5 md:px-30 ${alignItems} ${isImageLeft ? '' : 'md:flex-row-reverse'} ${innerClass}`}
      >
        {/* Image */}
        <div className={`flex-1 md:sticky md:top-50`}>
          <div className={` overflow-hidden w-full lg:rounded-[40px] rounded-[10px] relative `}>
            <Image
              src={imageUrl || FALLBACK_IMAGE}
              alt={title || 'Section image'}
              width={600}
              height={400}
              className={`w-full ${imageHeight === 'tall' ? 'h-[353px] md:h-[568px] object-cover object-top' : 'h-auto object-contain'} `}
            />
          </div>
        </div>

        {/* Content */}
        <div
          className={`w-full md:flex-1 flex flex-col gap-6 text-left md:text-left items-start justify-center`}
        >
          {title && (
            <h2 className="text-left font-montserrat text-[28px] sm:text-[32px] leading-[36px] sm:leading-[40px] font-black text-wfzo-grey-900">
              {title}
            </h2>
          )}
          {/* <div className="font-source text-base leading-6 text-wfzo-grey-700 whitespace-pre-line">
            {content}
          </div> */}
          <div
      className="font-source text-base leading-6 text-wfzo-grey-700 whitespace-pre-line"
      dangerouslySetInnerHTML={{ __html: parseRichText(content) }}
    />
    <div className=''>
      {cta?.title && (
                <Link href={(cta.url || '/') as any} target={cta.targetBlank ? '_blank' : '_self'}>
                  {variant == 'gold' ? (
                    <GoldButton>{cta.title || 'Get in touch'}</GoldButton>
                  ) : (
                    <LightButton>{cta.title || 'Get in touch'}</LightButton>
                  )}
                </Link>
              )}
    </div>

        </div>
      </div>
    </div>
  );
}

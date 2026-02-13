import Image from 'next/image';
import Flag from 'react-world-flags';
interface TestimonialCardProps {
  text: string;
  name: string;
  organization: string;
  position: string;
  avatar?: string | null;
  className?: string;
  location?: string;
  /** Max number of lines to show for the testimonial text before truncation */
  maxLines?: number;
}

export default function TestimonialCard({
  text,
  name,
  organization,
  position,
  avatar,
  className = '',
  location,
  maxLines = 5,
}: TestimonialCardProps) {
  return (
    <div
      className={`bg-white rounded-[20px] h-[240px] relative group flex flex-col
      transition-transform duration-300 shadow-[0_10px_32px_-4px_rgba(139,105,65,0.1),0_6px_14px_-6px_rgba(139,105,65,0.12)] 
      transform-gpu origin-center p-4 ${className}`}
    >
      {/* Fixed-height text region reserving space for up to maxLines lines */}
      <div
        className="w-full overflow-hidden"
        style={{ height: `${maxLines * 24}px` }} /* 24px = leading-6 line-height */
      >
        <p
          className="ext-wfzo-grey-700 font-source text-sm font-normal leading-5 self-stretch  overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {text}
        </p>
      </div>
      <div className="flex items-center gap-3 w-full mt-4">
        <div className="w-[72px] h-[72px] rounded-lg bg-gray-200 overflow-hidden relative">
          {avatar ? (
            <Image src={avatar} alt={name || 'Avatar'} fill className="object-cover object-top" />
          ) : null}
        </div>
        <div className="flex flex-col justify-center items-center gap-1 flex-1">
          <div className="text-wfzo-grey-900 font-source text-base font-bold leading-5 self-stretch">
            {name}
          </div>
          <div className="text-wfzo-grey-700 font-source text-sm font-normal leading-5 self-stretch">
            {organization}
          </div>
          <div className="flex justify-center items-center gap-3 self-stretch">
            <div className="flex-1 text-wfzo-grey-700 font-source text-sm font-normal leading-5">
              {position}
            </div>
          </div>
        </div>
      </div>
      {location && (
        <div className="absolute bottom-15 right-4 z-20">
          <Flag code={location} style={{ width: 21, height: 15, borderRadius: 4 }} />
        </div>
      )}
    </div>
  );
}

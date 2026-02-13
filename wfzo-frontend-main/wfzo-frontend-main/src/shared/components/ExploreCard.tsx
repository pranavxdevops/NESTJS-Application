import Link from 'next/link';

interface ExploreCardProps {
  title: string;
  description?: string;
  image: string;
  link: string; // destination URL/path for the card
  className?: string;
}

export default function ExploreCard({
  title,
  description,
  image,
  link='/',
  className = "",
}: ExploreCardProps) {
  const isExternal = /^https?:\/\//i.test(link);
  const content = (
    <div className={`relative rounded-2xl overflow-hidden group h-[200px] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wfzo-gold-600 ${className}`}>
      {/* Background image with zoom + blur */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-120 blur-sm"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      {/* Overlay for better contrast on text if needed */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" aria-hidden="true" />
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        <h3 className="font-montserrat font-extrabold text-white mb-1 text-2xl">{title}</h3>
        {description && (
          <p className="text-white font-source text-base leading-6 line-clamp-3">{description}</p>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title}
        className="block"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link} aria-label={title} className="block">
      {content}
    </Link>
  );
}

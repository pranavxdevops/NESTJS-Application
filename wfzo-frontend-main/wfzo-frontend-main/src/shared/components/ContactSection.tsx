import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { Link } from 'i18n/navigation';
import GoldButton from './GoldButton';
import LightButton from './LightButton';

interface ContactSectionProps {
  title: string;
  description: string;
  backgroundImage?: { url?: string; alt?: string };
  cta?: { title: string; url?: string; targetBlank?: boolean; variant?: string; id?: string; type?:string };
  variant?: 'gold' | 'light';
}

export default function ContactSection({
  title,
  description,
  backgroundImage,
  cta,
  variant = 'gold',
}: ContactSectionProps) {
  const bgUrl = backgroundImage?.url
    ? getStrapiMediaUrl(backgroundImage.url, FALLBACK_IMAGE)
    : FALLBACK_IMAGE;

  return (
    <section className="relative py-48 overflow-hidden group">
      {/* Background */}
      {/* <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-110 md:group-hover:blur-sm blur-sm md:blur-0"
        style={{ backgroundImage: `url(${bgUrl})` }}
      /> */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-xs md:hidden"
        style={{ backgroundImage: `url(${bgUrl})` }}
        aria-hidden
      />

      {/* Desktop: clear by default, scale+blur on hover.
      We use an inline transition so blur can animate slower than transform. */}
      <div
        className="
          absolute inset-0 bg-cover bg-center hidden md:block
          transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)]
          group-hover:scale-110 group-hover:blur-xs
        "
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* Semi-transparent overlay to make text readable */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto px-5 md:px-30">
        <div className="max-w-4xl">
          {cta?.url && 
          <Link href={(cta.url || '/') as any} target={cta.targetBlank ? '_blank' : '_self'}>
            <h2 className="text-4xl md:text-6xl font-montserrat font-black text-white mb-6">
              {title || 'Contact us'}
            </h2>
          </Link>
          }
          <p className="text-white font-source text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            {description ||
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae purus sit amet risus lacinia varius in ut lorem.'}
          </p>

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
    </section>
  );
}

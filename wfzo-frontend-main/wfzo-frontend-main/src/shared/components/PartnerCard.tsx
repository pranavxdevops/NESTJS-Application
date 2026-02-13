import Image from 'next/image';
interface PartnerCardProps {
  logo: string;
}

export default function PartnerCard({ logo }: PartnerCardProps) {
  
  return (

    <div className="bg-white shadow-wfzo rounded-2xl w-full max-w-sm lg:w-full relative overflow-hidden flex items-center justify-center p-6 h-36 sm:h-40 md:h-44 lg:h-48 transition-transform duration-300 hover:scale-[1.02] hover:shadow-wfzo">
      <Image
        src={logo}
        alt="Partner logo"
        fill
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 80vw"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}

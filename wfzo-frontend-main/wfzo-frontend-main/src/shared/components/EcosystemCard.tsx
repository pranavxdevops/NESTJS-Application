interface EcosystemCardProps {
  title: string;
  description: string;
  image: string;
  isMobile?: boolean;
}

export default function EcosystemCard({
  title,
  description,
  image,
  isMobile = false,
}: EcosystemCardProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden group ${
        isMobile ? "h-48" : "flex-1 h-[300px]"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-120"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 glass-effect" />
      <div className="absolute inset-0 gradient-overlay" />
      <div className="relative z-10 h-full flex flex-col justify-end p-8">
        <h3
          className={`font-montserrat font-extrabold text-white mb-1 ${
            isMobile ? "text-xl" : "text-2xl"
          }`}
        >
          {title}
        </h3>
        <p className="text-white font-source text-base leading-6 line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
}
import ContentHeader from '@/shared/components/ContentHeader';
import Image from 'next/image';

type Benefit = {
  label: string;
  info: string;
  iconKey?: string | null;
};

interface Props {
  title?: string;
  benefits: Benefit[];
  className?: string;
}

export default function BenefitsSection({
  title = 'Benefits of being a member',
  benefits = [],
  className = '',
}: Props) {
  const iconMap: Record<string, string> = {
    industryResearch: '/assets/industry_research.svg',
    knowledge: '/assets/knowledge.svg',
    events: '/assets/events.svg',
    support: '/assets/support.svg',
    training: '/assets/training.svg',
    network: '/assets/network.svg',
  };
  return (
    <div className={`px-5 md:px-30 py-10 md:py-20 ${className}`}>
       <ContentHeader header={title } description={''} pageHeading={false} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {benefits?.map((benefit, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-4 p-6 md:p-8 rounded-[20px] bg-wfzo-gold-100 h-full"
          >
            <div className="flex flex-col justify-center items-start gap-2 self-stretch flex-1">
              <h3 className="text-wfzo-grey-900 font-montserrat text-2xl font-extrabold leading-7 md:leading-8">
                {benefit.label}
              </h3>
              <p className="text-wfzo-grey-700 font-source text-md font-normal leading-6">
                {benefit.info}
              </p>
            </div>
            <div className="flex justify-end items-center gap-2.5 self-stretch">
              {/* Icon */}
                            {benefit.iconKey && iconMap[benefit.iconKey] && (
                              <Image
                                src={iconMap[benefit.iconKey]}
                                alt={benefit.label}
                                width={52}
                                height={52}
                                className="object-contain"
                              />
                            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

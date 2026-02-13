import { getAppPublicImages } from '@/lib/utils/getMediaUrl';
import PartnerCard from '@/shared/components/PartnerCard';
import { Link } from 'i18n/navigation';
import React from 'react';
import partners from '@/shared/data/ourpartners.json';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
interface PartnersSectionProps {
  title: string;
}

export default function PartnersSection({ title = 'Our Partners' }: PartnersSectionProps) {
  return (
    <section className="py-10 md:py-20 bg-[#FCFAF8]">
      <div className="mx-auto px-5 md:px-30">
        {/* Section Header */}
        <div className="mb-8">
          <Link href="/our-partners">
            <h2 className="text-2xl md:text-4xl font-montserrat font-black text-wfzo-grey-800">
              {title}
            </h2>
          </Link>
        </div>

        <div className=" ">
          {partners && (
            <AdvancedCarousel
              itemsCount={partners.length}
              title={''}
              description={''}
              pageHeading={false}
              // headerCta={cta}
              visibleSlides={{
                xs: 1.2, // 1 card on mobile
                sm: 1, // 2 cards on small tablets
                md: 2, // 3 cards on tablets
                lg: 3, // 4 cards on desktop
                xl: 4, // 4 cards on large desktop
              }}
              slidesToScroll={1} // Scroll 1 card at a time
              autoplay={true}
              autoplayDelay={5000}
              loop={true}
              showControls={true}
              showProgressBar={true}
              gap={12} // 16px gap between cards
              containerClassName=''
            >
              {partners.map((partner, idx) => (
                <div key={idx} className="h-full mb-6">
                  
                  <PartnerCard key={partner.id} logo={getAppPublicImages(partner.logo)} />
                </div>
              ))}
            </AdvancedCarousel>
          )}
        </div>
      </div>
    </section>
  );
}

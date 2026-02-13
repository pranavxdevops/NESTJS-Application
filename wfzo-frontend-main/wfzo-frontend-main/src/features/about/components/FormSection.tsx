'use client';

import Image from 'next/image';
import ContactForm from './ContactForm';
import ContentHeader from '@/shared/components/ContentHeader';
import FeaturedMemberFormWrapper from '@/shared/components/FeaturedMemberFormWrapper';

interface InfoSectionProps {
  title: string;
  description: string;
  image: string;
  alt?: string;
  className?: string;
}

export default function InfoSection({
  title,
  description,
  image,
  alt = 'Image',
  className = '',
}: InfoSectionProps) {
  return (
    <section className="w-full px-5 md:px-30 py-10 md:py-20 flex justify-center lg:justify-start">
      <div className="grid lg:grid-cols-2 items-stretch gap-8 w-full">
        <div className="flex flex-col h-full min-h-0">
          <ContentHeader header={title} description={description} pageHeading={true} />
          <div className="relative w-full flex-1 min-h-[280px] md:min-h-[360px] rounded-[40px] overflow-hidden mx-auto lg:mx-0 mt-6">
                  <Image src={image} alt={alt} fill className="object-cover object-top" priority />
                </div>
        </div>
        <div className="flex flex-col min-h-0 mt-5">
          <FeaturedMemberFormWrapper enquiryType="submit_question" />
        </div>
      </div>
    </section>
  );
}

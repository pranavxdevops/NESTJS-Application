'use client';

import { useRouter } from 'next/navigation';

interface FeaturedMemberCardProps {
  locale: string;
}

export default function FeaturedMemberCard({ locale }: FeaturedMemberCardProps) {
  const router = useRouter();

  return (
    <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#FCFAF8]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-wfzo-grey-900 font-source text-xl font-normal leading-6">
            Be a Featured Member
          </h3>
          <p className="text-wfzo-grey-700 font-source text-sm font-normal leading-5">
            Stand out in the community by becoming a Featured Member. Enjoy enhanced visibility with profile highlights and exclusive benefits designed to help you get noticed.
          </p>
        </div>

        <button
          onClick={() => router.push(`/${locale}/profile/be-a-featured-member`)}
          className="flex flex-col p-px rounded-xl bg-wfzo-gold-700 cursor-pointer"
        >
          <div className="flex px-6 py-[7px] justify-center items-center gap-2 rounded-[11px] border-t border-r border-l border-wfzo-gold-500 bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500">
            <span className="text-white font-source text-base font-semibold leading-6">
              Get featured
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
